import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Pressable, Linking} from 'react-native';
import TextWrapper from '../text-wrapper.component';
import {COLORS} from '../../assets/theme/theme';
import Icon from '../icon.component';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import {useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RATING_API, MARK_MORE_INFO_API} from '@env';

const COURSE_URL = 'https://www.younglabs.in/course/Eng_Hw';

const NMI_SOURCE = 'app';

const PostDemoAction = () => {
  const [rating, setRating] = useState(0);
  const [isRated, setIsRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disableButton, setDisableButton] = useState(false);

  const {demoData} = useSelector(state => state.joinDemo);

  useEffect(() => {
    const checkForRating = async () => {
      try {
        const rating = await AsyncStorage.getItem('isRated');
        if (rating === 'true') {
          setIsRated(true);
        }
        setLoading(false);
      } catch (error) {
        console.log('async rated error', error);
      }
    };

    checkForRating();
  }, []);

  const handleSaveRating = async rate => {
    const rated = rate * 2;

    try {
      const response = await fetch(RATING_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: demoData.bookingId,
          rating: rated,
        }),
      });

      if (response.status === 200) {
        await AsyncStorage.setItem('isRated', 'true');
        setIsRated(true);
      }
    } catch (error) {
      console.log('Demo rating error', error);
    }
  };

  const onChangeRating = rate => {
    setRating(rate);
    handleSaveRating(rate);
  };

  const redirectToWebsiteToBuyCourse = () => Linking.openURL(COURSE_URL);

  const markNeedMoreInfo = async () => {
    try {
      setDisableButton(true);
      const isNmi = await AsyncStorage.getItem('nmi');
      if (!isNmi) {
        const response = await fetch(MARK_MORE_INFO_API, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: demoData.bookingId,
            source: NMI_SOURCE,
          }),
        });

        if (response.status === 200) {
          await AsyncStorage.setItem('nmi', 'true');
        }
      }

      openWhatsApp();
      setDisableButton(false);
    } catch (error) {
      console.log('nmi error', error);
      setDisableButton(false);
    }
  };

  const openWhatsApp = async () => {
    const phoneNumber = '+919289029696';
    let url = '';

    if (Platform.OS === 'android') {
      url = `whatsapp://send?phone=${phoneNumber}&text=Hello, I need more info about the full course`;
    } else if (Platform.OS === 'ios') {
      url = `whatsapp://wa.me/${phoneNumber}&text=Hello, I need more info about the full course`;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
    }
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      {!isRated ? (
        <View style={styles.ratingContainer}>
          <TextWrapper
            fs={28}
            color={COLORS.pgreen}
            fw="600"
            styles={{textAlign: 'center'}}>
            Congratulations for attending your free class.
          </TextWrapper>
          <View style={styles.ratingWrapper}>
            <TextWrapper fs={20}>Please rate your class experience</TextWrapper>
            <View style={styles.starsContainer}>
              {Array.from({length: 5}, (_, i) => {
                return (
                  <Pressable key={i} onPress={() => onChangeRating(i + 1)}>
                    <Icon
                      name={
                        rating
                          ? i < rating
                            ? 'star'
                            : 'star-outline'
                          : 'star-outline'
                      }
                      size={32}
                      color={
                        rating ? (i < rating ? COLORS.pgreen : 'gray') : 'gray'
                      }
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.ctasWrapper}>
          <TextWrapper fs={20} styles={{lineHeight: 28}}>
            Would you like to continue with the course and improve your child's
            handwriting?
          </TextWrapper>
          <View style={styles.ctas}>
            <Pressable
              style={({pressed}) => [
                styles.ctaButton,
                {opacity: pressed ? 0.8 : 1},
              ]}
              disabled={disableButton}
              onPress={markNeedMoreInfo}>
              <MIcon name="whatsapp" size={22} color={COLORS.pgreen} />
              <TextWrapper>Yes, need more info</TextWrapper>
            </Pressable>
            <Pressable
              style={({pressed}) => [
                styles.ctaButton,
                {opacity: pressed ? 0.8 : 1},
              ]}
              onPress={redirectToWebsiteToBuyCourse}>
              <MIcon name="web" size={22} color={COLORS.black} />
              <TextWrapper>Buy on website</TextWrapper>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

export default PostDemoAction;

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
  },
  ratingContainer: {
    marginTop: 16,
    height: 200,
  },
  ratingWrapper: {
    height: 146,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 8,
  },
  ctasWrapper: {
    paddingVertical: 12,
  },
  ctas: {
    flex: 1,
    gap: 10,
    marginTop: 20,
  },
  ctaButton: {
    height: 48,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1.85,
    borderRadius: 4,
    // paddingLeft: 30,
    gap: 8,
    backgroundColor: COLORS.white,
  },
});
