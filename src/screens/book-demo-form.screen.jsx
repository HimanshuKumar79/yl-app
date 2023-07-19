import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
} from 'react-native';
import Button from '../components/button.component';
import {COLORS} from '../assets/theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {useDispatch, useSelector} from 'react-redux';
import CountryList from '../components/country-list.component';
import {isValidNumber} from '../utils/isValidNumber';
import Spinner from '../components/spinner.component';
import Modal from '../components/modal.component';
import {DropdownList, Dropdown} from '../components/dropdown.component';
import Input from '../components/input.component';
import TextWrapper from '../components/text-wrapper.component';
import Spacer from '../components/spacer.component';

import {
  setTimezone,
  startFetchingIpData,
} from '../store/book-demo/book-demo.reducer';
import {bookDemoSelector} from '../store/book-demo/book-demo.selector';

const ageList = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const INITIAL_sTATE = {
  name: '',
  childAge: null,
  phone: '',
};

const BookDemoScreen = ({navigation}) => {
  const [gutter, setGutter] = useState(0);
  const [open, setOpen] = useState(false);
  const [formFields, setFormFields] = useState(INITIAL_sTATE);
  const [errorMessage, setErrorMessage] = useState({
    phone: '',
    name: '',
    childAge: '',
  });
  const [visible, setVisible] = useState(false);
  const [country, setCountry] = useState({callingCode: ''});

  const dispatch = useDispatch();

  const {timezone, ipData, loading} = useSelector(bookDemoSelector);

  useEffect(() => {
    if (!ipData) {
      dispatch(startFetchingIpData());
    }
  }, [ipData]);

  useEffect(() => {
    if (ipData) {
      setCountry({
        callingCode: ipData.calling_code,
        countryCode: {cca2: ipData.country_code2},
      });
    }
  }, [ipData]);

  useEffect(() => {
    if (ipData) {
      const tz = ipData.time_zone.offset + ipData.time_zone.dst_savings;
      dispatch(setTimezone(tz));
    }
  }, [ipData]);

  const handleChangeValue = item => {
    setFormFields(preValue => ({...preValue, ...item}));
  };

  const handleOnClose = () => setOpen(false);

  const handleDemoSlots = async () => {
    const {childAge, name, phone} = formFields;

    if (!childAge || !name || !phone) {
      setErrorMessage({
        ...errorMessage,
        name: 'Fields are required.',
        childAge: 'Fields are required.',
        phone: 'Fields are required.',
      });
      return;
    }

    if (!childAge) {
      setErrorMessage({...errorMessage, childAge: 'Select child age'});
      return;
    } else if (!name) {
      setErrorMessage({...errorMessage, name: 'Please enter your name'});
      return;
    } else if (!phone) {
      setErrorMessage({...errorMessage, phone: 'Please enter phone number'});
      return;
    }

    const isValidPhone = await isValidNumber(phone, country.countryCode.cca2);
    if (!isValidPhone) {
      setErrorMessage({...errorMessage, phone: 'Please enter a valid number'});
      return;
    }

    navigation.navigate('BookDemoSlots', {formFields, country});
  };

  const handleBookNow = async () => {
    const bodyData = {
      ...formFields,
      timeZone: timezone,
      demoDate: currentSlotTime.demoDate,
      bookingType: 'direct',
      source: 'Website',
      course: 'Eng_Hw',
      digits: 'na',
      slotId: currentSlotTime.slotId,
      country: ipData.country_name.toUpperCase(),
      countryCode: country.callingCode,
      websiteSrc: 'website',
    };

    try {
      const response = await fetch(ADD_BOOKINGS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const bookingData = await response.json();
      if (response.status === 200) {
        console.log('bookingData', bookingData);

        await AsyncStorage.setItem(
          'bookingid',
          JSON.stringify(bookingData.bookingId),
        );
        dispatch(startFetchBookingDetailsFromId(bookingData.bookingId));
        navigation.goBack();
      } else if (response.status === 400) {
        console.log('bookingData', bookingData);
      }
    } catch (error) {
      console.log('booking error', error);
    }
  };

  const handleSelectCountry = country => {
    let code = '';
    if (country.callingCode.hasOwnProperty('root')) {
      code = country.callingCode.root.concat(country.callingCode.suffixes[0]);
    }
    country.callingCode = code;
    setCountry(country);
    setVisible(false);
  };

  return (
    <KeyboardAvoidingView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{height: '100%'}}>
        <View style={styles.container}>
          <View>
            <Input
              inputMode="text"
              placeholder="Enter your name"
              value={formFields.name}
              onChangeText={name => handleChangeValue({name})}
            />
            {errorMessage.name && (
              <TextWrapper fs={14} color={COLORS.pred}>
                {errorMessage.name}
              </TextWrapper>
            )}
            <Spacer />
            <View style={styles.row}>
              <Pressable
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.black,
                }}
                onPress={() => setVisible(p => !p)}>
                <TextWrapper>{country.callingCode}</TextWrapper>
              </Pressable>
              <Input
                inputMode="numeric"
                placeholder="Enter your phone number"
                value={formFields.phone}
                onChangeText={phone => handleChangeValue({phone})}
              />
            </View>
            {errorMessage.phone && (
              <TextWrapper fs={14} color={COLORS.pred}>
                {errorMessage.phone}
              </TextWrapper>
            )}
            <TextWrapper fs={14} color="gray">
              Please enter valid whatsapp number to receive further class
              details
            </TextWrapper>
            <Spacer />
            <Dropdown
              defaultValue="Select child age"
              value={formFields.childAge}
              onPress={() => setOpen(true)}
              onLayout={event =>
                setGutter(
                  event.nativeEvent.layout.y + event.nativeEvent.layout.height,
                )
              }
            />
            {errorMessage.childAge && (
              <TextWrapper fs={14} color={COLORS.pred}>
                {errorMessage.childAge}
              </TextWrapper>
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button bg={COLORS.pgreen} onPress={handleDemoSlots}>
          Select date and book
        </Button>
      </View>
      <CountryList
        visible={visible}
        onChangeVisible={v => setVisible(v)}
        onSelect={handleSelectCountry}
      />
      {open && (
        <DropdownList
          data={ageList}
          gutter={gutter}
          currentValue={formFields.childAge}
          onClose={handleOnClose}
          onChange={handleChangeValue}
        />
      )}
      {loading && (
        <Modal bg="rgba(0,0,0,0.25)">
          <Spinner />
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

export default BookDemoScreen;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 18,
  },
  footer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
});