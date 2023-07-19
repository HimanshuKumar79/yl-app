import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import Spacer from '../components/spacer.component';
import Button from '../components/button.component';
import {joinClassOnZoom} from '../natiive-modules/zoom-modules';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Input from '../components/input.component';
import JoinDemo from '../components/join-demo.component';
import Seperator from '../components/seperator.component';

import {COLORS, FONTS} from '../assets/theme/theme';

import {useSelector, useDispatch} from 'react-redux';
import {
  startFetchBookingDetailsFromId,
  startFetchBookingDetailsFromPhone,
  setDemoPhone,
  setDemoBookingId,
} from '../store/join-demo/join-demo.reducer';
import Spinner from '../components/spinner.component';
import PostDemoAction from '../components/join-demo-class-screen/post-demo-actions.component';
import DemoWaiting from '../components/join-demo-class-screen/demo-waiting.component';
import Modal from '../components/modal.component';

const MARK_ATTENDENCE_URL =
  'https://younglabsapis-33heck6yza-el.a.run.app/admin/demobook/markattendance';

const getTimeRemaining = bookingDate => {
  const countDownTime = new Date(bookingDate).getTime();
  const now = new Date().getTime();

  const remainingTime = countDownTime - now;

  const days = Math.floor((remainingTime / (1000 * 60 * 60 * 24)) % 24);
  const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
  const seconds = Math.floor((remainingTime / 1000) % 60);

  if (remainingTime <= 0) {
    return {days: 0, hours: 0, minutes: 0, seconds: 0, remainingTime};
  }

  return {days, hours, minutes, seconds, remainingTime};
};

const INITIAL_TIME = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

// Main Component
const DemoClassScreen = ({route, navigation}) => {
  const {
    params: {
      data: {queryData},
    },
  } = route;

  const dispatch = useDispatch();
  const {demoData, loading, demoPhoneNumber, demoBookingId} = useSelector(
    state => state.joinDemo,
  );

  const [childName, setChildName] = useState('');
  const [bookingTime, setBookingTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [isTimeover, setIsTimeover] = useState(false);
  const [zoomData, setZoomData] = useState(null);
  const [showJoinButton, setShowJoinButton] = useState(false);
  const [shouldShowJoin, setShouldShowJoin] = useState(false);
  const [isAttended, setIsAttended] = useState(false);

  // Set demo booking id
  useEffect(() => {
    const getDemoId = async () => {
      try {
        const demoIdFromAsyncStorage = await AsyncStorage.getItem('bookingid');
        const phoneFromAsyncStorage = await AsyncStorage.getItem('phone');

        if (queryData && !demoIdFromAsyncStorage) {
          await AsyncStorage.setItem('bookingid', queryData?.demoId);
        }

        const demoId = demoIdFromAsyncStorage || queryData?.demoId;

        if (phoneFromAsyncStorage) {
          dispatch(setDemoPhone(phoneFromAsyncStorage));
        } else if (demoId) {
          dispatch(setDemoBookingId(demoId));
        }
      } catch (error) {
        console.log('Async storage error', error);
      }
    };

    getDemoId();
  }, [dispatch, queryData]);

  // set demo data
  useEffect(() => {
    const setDemoData = async () => {
      // If user put wrong number
      if (demoData.hasOwnProperty('message')) {
        return;
      }
      try {
        const {
          demoDate: {_seconds},
          meetingId,
          pwd,
          attendedOrNot,
          bookingId: bookingIdFromDemoData,
        } = demoData;

        const demodate = new Date(_seconds * 1000).getDate();
        const today = new Date().getDate();

        console.log('attended', attendedOrNot);

        // Mark attendence
        if (demodate === today) {
          if (!attendedOrNot) {
            const markAttendenceResponse = await fetch(MARK_ATTENDENCE_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'student',
                bId: bookingIdFromDemoData,
              }),
            });
            if (markAttendenceResponse.status === 200) {
              const message = await markAttendenceResponse.json();
              ToastAndroid.showWithGravity(
                message,
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM,
              );
            }
          }
        }

        // If marked attendence, set zoom data(meetingId, password)
        if (meetingId && pwd) {
          console.log('Got zoom data successfully.', {meetingId, pwd});
          setZoomData({meetingId, pwd});
          setShowJoinButton(true);
          setIsAttended(attendedOrNot);
        }

        // Set booking time for timer
        if (_seconds) setBookingTime(_seconds * 1000 + 1000 * 60);
      } catch (error) {
        console.log('setDemoData_error', error);
      }
    };

    if (demoData) {
      setDemoData();
    }
  }, [demoData]);

  useEffect(() => {
    if (demoData) {
      if (demoData.hasOwnProperty('message')) {
        ToastAndroid.showWithGravity(
          'Wrong number',
          ToastAndroid.SHORT,
          ToastAndroid.BOTTOM,
        );
        dispatch(setDemoPhone(''));
      }
    }
  }, [demoData, dispatch]);

  // Call api to get booking status from booking id
  useEffect(() => {
    if (demoBookingId) {
      !demoData && dispatch(startFetchBookingDetailsFromId(demoBookingId));
    }
  }, [demoBookingId, dispatch, demoData]);

  // Call api to get booking status from phone number
  useEffect(() => {
    if (demoPhoneNumber) {
      !demoData && dispatch(startFetchBookingDetailsFromPhone(demoPhoneNumber));
    }
  }, [demoPhoneNumber, dispatch, demoData]);

  // Timer
  useEffect(() => {
    let timer;

    if (bookingTime) {
      timer = setInterval(() => {
        const remaining = getTimeRemaining(bookingTime);
        if (remaining.remainingTime <= 0) {
          setIsTimeover(true);
          clearInterval(timer);
          return;
        }

        if (new Date(bookingTime).getTime() - 1000 <= new Date().getTime()) {
          dispatch(startFetchBookingDetailsFromId(demoData.bookingId));
        }

        // set time to show
        setTimeLeft(remaining);
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [bookingTime, demoBookingId, demoPhoneNumber, dispatch]);

  // Do not show join button after 1 hour of demo ended
  useEffect(() => {
    if (bookingTime) {
      const afterOneHourFromDemoDate =
        new Date(bookingTime).getTime() + 1000 * 60 * 60;

      if (afterOneHourFromDemoDate <= new Date().getTime()) {
        // Hide class join button
        setShowJoinButton(false);
      }
    }
  }, [bookingTime]);

  useEffect(() => {
    const checkForIdOrPhone = async () => {
      try {
        const id = await AsyncStorage.getItem('bookingid');
        const phone = await AsyncStorage.getItem('phone');
        const shouldShowJoinComponent = !id && !phone;
        setShouldShowJoin(shouldShowJoinComponent);
      } catch (error) {
        console.log('error from async storage', error);
      }
    };

    checkForIdOrPhone();
  }, [demoBookingId, demoPhoneNumber, demoData]);

  // Join Class
  const handleJoinClass = async () => {
    if (!zoomData || !childName) {
      console.log('No class data found');
      return;
    }

    try {
      const {meetingId, pwd} = zoomData;
      const res = await joinClassOnZoom(JSON.stringify(meetingId), pwd);
      console.log('Join Class', res);
      // if (res === 'class joined.') {
      //   if (new Date(bookingTime).getTime() <= new Date().getTime()) {
      //     demoData.attendedOrNot && setIsAttended(true);
      //   }
      // }
    } catch (error) {
      console.log('Join class error', error);
    }
  };

  const handleBookingStatus = phone => {
    dispatch(startFetchBookingDetailsFromPhone(phone));
  };

  return loading ? (
    <Modal>
      <Spinner />
    </Modal>
  ) : (
    <KeyboardAvoidingView behavior="padding">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.box}>
            {bookingTime
              ? new Date(bookingTime).getTime() > new Date().getTime() && (
                  <DemoWaiting timeLeft={timeLeft} />
                )
              : null}
            {isTimeover
              ? showJoinButton && (
                  <>
                    <Input
                      placeholder="Child Name"
                      value={childName}
                      onChangeText={e => setChildName(e)}
                    />
                    <Spacer />
                    <Button
                      rounded={4}
                      onPress={handleJoinClass}
                      bg={COLORS.pgreen}>
                      Join Class
                    </Button>
                  </>
                )
              : null}
            {shouldShowJoin && (
              <>
                <JoinDemo handleBookingStatus={handleBookingStatus} />
                <Spacer space={4} />
                <Seperator text="or" />
                <Spacer space={4} />
                <Button
                  rounded={4}
                  bg="transparent"
                  outlined={true}
                  outlineColor={COLORS.black}
                  textColor={COLORS.black}
                  onPress={() => navigation.navigate('BookDemoForm')}>
                  Book A Free class
                </Button>
              </>
            )}

            {
              // If user attended demo class
              // Demo has ended
              // Show post action after demo class
              bookingTime
                ? new Date(bookingTime).getTime() + 1000 * 60 <=
                    new Date().getTime() &&
                  isAttended && <PostDemoAction />
                : null
            }
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DemoClassScreen;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  logo: {
    maxWidth: '100%',
    height: 110,
  },
  box: {
    maxWidth: 540,
    marginHorizontal: 'auto',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
  },
  textCenter: {
    textAlign: 'center',
  },
  demoDateText: {
    fontSize: 18,
    color: 'gray',
    fontFamily: FONTS.roboto,
  },
});