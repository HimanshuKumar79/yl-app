import {all, call, put, takeLatest} from 'redux-saga/effects';
import {
  fetchBookingDetailsFromBookingId,
  fetchBookingDetils,
  updateChildName,
  getAcsToken,
  markAttendance,
  saveFreeClassRating,
  saveNeedMoreInfo,
  fetchBookingDetailsFromPhone,
  getLeadEmail,
} from '../../utils/api/yl.api';

import {
  setBookingDetailSuccess,
  startFetchBookingDetailsFromId,
  startFetchBookingDetailsFromPhone,
  setPhoneAsync,
  setDemoPhone,
  setDemoData,
  setBookingTime,
  setIsAttended,
  setShowJoinButton,
  setTeamUrl,
  joinFreeClass,
  setErrorMessage,
  saveRating,
  setIsRated,
  checkForRating,
  setRatingLoading,
  markNMI,
  markNMISuccess,
  setLoading,
  joinDemo,
  setBookingDetailsFailed,
} from './join-demo.reducer';

import {BASE_URL} from '@env';
import {startCallComposite} from '../../natiive-modules/team-module';

// import AsyncStorage from '@react-native-async-storage/async-storage';
import {LOCAL_KEYS} from '../../utils/constants/local-keys';
import {getCurrentDeviceId} from '../../utils/deviceId';
import {setEmail} from '../auth/reducer';
import {localStorage} from '../../utils/storage/storage-provider';

const TAG = 'JOIN_DEMO_SAGA_ERROR';

/**
 * @author Shobhit
 * @since 20/09/2023
 * @param payload phone number
 * @description
 * Fetch demo details using phone number
 * Also fetch booking details
 * Save phone number to local storage
 */
function* fetchDemoDetailsFromPhone({payload}) {
  try {
    const token = yield getCurrentDeviceId();

    const response = yield call(fetchBookingDetailsFromPhone, payload, token);
    const data = yield response.json();

    // let callingCode = yield AsyncStorage.getItem(LOCAL_KEYS.CALLING_CODE);

    // callingCode = callingCode?.replace('+', '') || '91';
    let callingCode = '91';

    const detailsResponse = yield call(fetchBookingDetils, {
      phone: JSON.parse(callingCode.concat(payload)),
    });

    const bookingDetails = yield detailsResponse.json();

    if (response.status === 400) {
      yield put(setLoading(false));
    }

    const checkPhone = localStorage.getNumber(LOCAL_KEYS.PHONE);
    console.log('checkPhone', checkPhone);
    if (!checkPhone) {
      console.log('hit checkPhone');
      localStorage.set(LOCAL_KEYS.PHONE, parseInt(payload));
    }

    // lead email
    const leadEmailResponse = yield call(getLeadEmail, bookingDetails.leadId);
    if (leadEmailResponse.status === 200) {
      const leadEmail = yield leadEmailResponse.json();
      yield put(setEmail(leadEmail.email));
    }

    yield put(setBookingDetailSuccess({demoData: data, bookingDetails}));
  } catch (error) {
    console.log('error', error);
    // yield put(setBookingDetailsFailed("Something went wrong, try again"))
    // if (error.message === ERROR_MESSAGES.NETWORK_STATE_ERROR) {
    //   yield put(setLoading(false));
    //   yield put(
    //     setCurrentNetworkState(startFetchBookingDetailsFromPhone(payload)),
    //   );
    // }
  }
}

/**
 * @author Shobhit
 * @since 20/09/2023
 * @param payload booking id
 * @description
 * Fetch demo details using booking id
 * Also fetch booking details
 * Save booking id to local storage
 */
function* fetchDemoDetailsFromBookingId({payload}) {
  try {
    const response = yield call(fetchBookingDetailsFromBookingId, payload);
    const data = yield response.json();

    const detailsResponse = yield call(fetchBookingDetils, {
      bookingId: payload,
    });
    const bookingDetails = yield detailsResponse.json();

    // set id to local storage
    // const bookingIdFromAsync = yield AsyncStorage.getItem(
    //   LOCAL_KEYS.BOOKING_ID,
    // );

    // if (!bookingIdFromAsync) {
    //   yield AsyncStorage.setItem(LOCAL_KEYS.BOOKING_ID, payload);
    // }

    yield put(setBookingDetailSuccess({demoData: data, bookingDetails}));
  } catch (error) {
    console.log(TAG, error);
    console.log('error');
    // if (error.message === ERROR_MESSAGES.NETWORK_STATE_ERROR) {
    //   yield put(setLoading(false));
    //   yield put(
    //     setCurrentNetworkState(startFetchBookingDetailsFromId(payload)),
    //   );
    // }
  }
}

// Phone from local storage
function* getPhoneFromStorage() {
  try {
    const phoneFromAsyncStorage = localStorage.getNumber(LOCAL_KEYS.PHONE);

    if (phoneFromAsyncStorage) {
      yield put(setDemoPhone(phoneFromAsyncStorage));
    }
  } catch (error) {
    console.log(TAG, error);
  }
}

/**
 * @author Shobhit
 * @since 20/09/2023
 * @param {object} payload demoData
 * @description Set demo data to states
 */
function* onSetDemoData({payload: {demoData, phone}}) {
  // If user put wrong number
  if (demoData.hasOwnProperty('message')) {
    return;
  }

  try {
    const {
      demoDate: {_seconds},
      attendedOrNot,
      bookingId,
      teamUrl: meetingLink,
    } = demoData;

    const demoTime = _seconds * 1000;

    const demodate = new Date(demoTime);
    const today = new Date().getDate();

    // Mark attendence
    if (demodate.getDate() === today) {
      if (!attendedOrNot) {
        const markAttendenceResponse = yield call(markAttendance, {bookingId});

        if (markAttendenceResponse.status === 200) {
          console.log('attendance marked.');
        }
      }
    }

    const timeover = demoTime < Date.now();
    const afterOneHour = demoTime + 1000 * 60 * 60 > Date.now();

    if (timeover && afterOneHour) {
      yield put(joinDemo({bookingId, phone}));
    }

    if (meetingLink) {
      yield put(setTeamUrl(meetingLink));
      yield put(setShowJoinButton(true));
      yield put(setIsAttended(attendedOrNot));
    }

    // Set booking time for timer
    if (_seconds) yield put(setBookingTime(demoTime + 1000 * 60));

    yield put(setLoading(false));
  } catch (error) {
    console.log('setDemoData_error', error);
  }
}

/**
 * @author Shobhit
 * @since 20/09/2023
 * @description Register Notifications for demo classs
 */
// function* demoNotifications({payload: {bookingTime}}) {
//   const classDate = new Date(bookingTime);
//   const currentTime = Date.now();

//   // If class passed
//   if (currentTime > classDate) {
//     return;
//   }

//   const ONE_HOUR = 60 * 60 * 1000;
//   const TEN_MINUTES = 10 * 60 * 1000;
//   const FIVE_MINUTES = 5 * 60 * 1000;
//   const ONE_DAY = 24 * 60 * 60 * 1000;

//   const beforeOneHour = classDate.getTime() - ONE_HOUR;
//   const beforeTenMinutes = classDate.getTime() - TEN_MINUTES;
//   const afterFiveMinutes = classDate.getTime() + FIVE_MINUTES;
//   // Set for 11am notification
//   const morningNotification = new Date(bookingTime);
//   morningNotification.setHours(11);

//   const hours = classDate.getHours();
//   const body = `Your have a class on ${classDate.toDateString()} at ${
//     hours >= 12 ? (hours === 12 ? hours : hours - 12) : hours
//   }:00 ${hours >= 12 ? 'pm' : 'am'}.`;

//   const morningNotificationBody = `You have a class at ${
//     hours >= 12 ? (hours === 12 ? hours : hours - 12) : hours
//   }:00 ${hours >= 12 ? 'pm' : 'am'}.`;

//   try {
//     const isNotification = yield AsyncStorage.getItem(
//       LOCAL_KEYS.COUNTDOWN_NOTIFICATION,
//     );

//     // If already set notifications
//     if (isNotification) return;

//     // Check for today
//     if (new Date().getDate() === classDate.getDate()) {
//       console.log('all notifications for today');
//       if (currentTime < classDate) {
//         if (currentTime < beforeTenMinutes) {
//           yield setCountdownTriggerNotification(
//             'countdown',
//             'countdown',
//             beforeTenMinutes,
//             'Your class is about to start in 10 minutes.',
//           );
//         }
//         if (currentTime < beforeOneHour) {
//           yield setCountdownTriggerNotification(
//             'countdown',
//             'countdown',
//             beforeOneHour,
//             'Your class starts in 1 hour. Kindly, join on time.',
//           );
//         }

//         if (new Date().getHours() < 11) {
//           yield setCountdownTriggerNotification(
//             'countdown',
//             'countdown',
//             morningNotification.getTime(),
//             morningNotificationBody,
//           );
//         }

//         yield setCountdownTriggerNotification(
//           'countdown',
//           'countdown',
//           afterFiveMinutes,
//           'Hurry! your class has already started, join now.',
//         );
//       }
//     } else {
//       console.log('set future notifications');
//       // Set notifications for future class
//       yield setCountdownTriggerNotification(
//         'countdown',
//         'countdown',
//         beforeTenMinutes,
//         'Your class is about to start in 10 minutes.',
//       );
//       yield setCountdownTriggerNotification(
//         'countdown',
//         'countdown',
//         beforeOneHour,
//         'Your class starts in 1 hour. Kindly, join on time.',
//       );
//       yield setCountdownTriggerNotification(
//         'countdown',
//         'countdown',
//         afterFiveMinutes,
//         'Hurry! your class has already started, join now.',
//       );

//       yield setCountdownTriggerNotification(
//         'countdown',
//         'countdown',
//         morningNotification.getTime(),
//         morningNotificationBody,
//       );

//       if (new Date().getHours() < 20) {
//         const beforeOneDay = new Date(classDate.getTime() - ONE_DAY);
//         beforeOneDay.setHours(20);
//         yield setCountdownTriggerNotification(
//           'countdown',
//           'countdown',
//           beforeOneDay.getTime(),
//           body,
//         );
//       }
//     }

//     yield AsyncStorage.setItem(LOCAL_KEYS.COUNTDOWN_NOTIFICATION, 'saved');
//   } catch (error) {
//     console.log('demo notification error', error);
//   }
// }

// Save acs token in local storage

function* saveAcsTokenInLocalStorage({data}) {
  const expire = data.expireOn;
  if (expire) {
    localStorage.set(
      LOCAL_KEYS.ACS_TOKEN_EXPIRE,
      new Date(expire).getTime().toString(),
    );
  }
  localStorage.set(LOCAL_KEYS.ACS_TOKEN, data.token);

  return data.token;
}

/**
 * @author Shobhit
 * @since 20/09/2023
 * @param bookingDetails an object that contains all booking related info
 * @param childName child name to join class
 * @param teamUrl join class using team url
 * @description
 * Join Demo Class
 * Save acs token to local storage using saveAcsTokenInLocalStorage function
 */
function* handleJoinClass({payload: {bookingDetails, childName, teamUrl}}) {
  console.log(childName, teamUrl, bookingDetails);
  if (!childName) {
    yield put(setErrorMessage('Please enter child name'));
    return;
  }

  try {
    const notChildName = bookingDetails.childName
      .toLowerCase()
      .includes('your child');
    if (notChildName) {
      yield call(updateChildName, {bookingDetails, childName});
    }

    if (teamUrl) {
      let token = localStorage.getString(LOCAL_KEYS.ACS_TOKEN);
      const tokenExpireTime = localStorage.getString(
        LOCAL_KEYS.ACS_TOKEN_EXPIRE,
      );
      const currentTime = Date.now();

      if (token) {
        const isTokenExpired =
          currentTime > new Date(parseInt(tokenExpireTime)).getTime();

        if (isTokenExpired) {
          const response = yield call(getAcsToken);

          const data = yield response.json();

          token = yield saveAcsTokenInLocalStorage({data});
        }
      } else {
        const response = yield call(getAcsToken);

        const data = yield response.json();

        token = yield saveAcsTokenInLocalStorage({data});
      }

      yield put(setErrorMessage(''));
      startCallComposite(childName, teamUrl, token);
    }
  } catch (error) {
    console.log('JOIN_CLASS_ERROR_JOIN_DEMO_SAGA', error);
  }
}

/**
 * @author Shobhit
 * @since 25/09/2023
 * @param bookingId booking id of free class
 * @param rating that user gives
 * @description Save user rating
 */
function* saveUserRating({payload: {bookingId, rating}}) {
  try {
    const response = yield call(saveFreeClassRating, {bookingId, rating});

    if (response.status === 200) {
      localStorage.set(LOCAL_KEYS.IS_RATED, 'true');
      yield put(setIsRated(true));
    }
  } catch (error) {
    console.log('JOIN_CLASS_ERROR_JOIN_DEMO_SAGA_RATING', error);
  }
}

// Check rating from local storage
function* checkRatingFromLocalStorage() {
  try {
    const rating = localStorage.getString(LOCAL_KEYS.IS_RATED);
    if (rating === 'true') {
      yield put(setIsRated(true));
    }
    yield put(setRatingLoading(false));
  } catch (error) {
    console.log('async rated error', error);
  }
}

/**
 * @author Shobhit
 * @since 25/09/2023
 * @param bookingId booking id of free class
 * @description Mark need more info
 */
function* handleNMI({payload: {bookingId}}) {
  const text = 'Hello, I need more info about the full course';
  try {
    // const isNmi = yield AsyncStorage.getItem(LOCAL_KEYS.NMI);
    // if (!isNmi) {

    const response = yield saveNeedMoreInfo({bookingId});

    // console.log(yield response.json());

    if (response.status === 200) {
      localStorage.set(LOCAL_KEYS.NMI, 'true');
      yield put(markNMISuccess());
      // const url = getWhatsappRedirectUrl(text);
      // yield Linking.openURL(url);
    }
    // } else {
    //   yield new Promise(resolve => setTimeout(resolve, 1000));

    //   yield put(markNMISuccess());

    //   const url = getWhatsappRedirectUrl(text);
    //   yield Linking.openURL(url);
    // }
  } catch (error) {
    console.log('saveNMIError', error.message);
    // if (error.message === ERROR_MESSAGES.NETWORK_STATE_ERROR) {
    //   yield put(setCurrentNetworkState(markNMI({bookingId})));
    // } else {
    //   yield put(
    //     setErrorMessage('Something went wrong. Can not redirect on WhatsApp.'),
    //   );
    // }
  }
}

function* handleJoinDemo({payload: {bookingId, phone}}) {
  try {
    const API_URL = `${BASE_URL}/admin/demoallocation/joindemo`;
    const response = yield fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({bookingId}),
    });
    const res = yield response.json();
    console.log('joinDemoRes=', res);
    if (response.status === 200) {
      yield call(fetchDemoDetailsFromPhone, {payload: phone});
    }
  } catch (error) {
    console.log('joinDemoError=', error);
  }
}

/**
 * Listener functions that call when dispatch a related action
 */

// start for phone number
function* demoBookingDetailsFromPhone() {
  yield takeLatest(
    startFetchBookingDetailsFromPhone().type,
    fetchDemoDetailsFromPhone,
  );
}

// start for booking id
function* demoBookingDetailsFromId() {
  yield takeLatest(
    startFetchBookingDetailsFromId().type,
    fetchDemoDetailsFromBookingId,
  );
}

// Get phone from local storage
function* startGetPhoneAsync() {
  yield takeLatest(setPhoneAsync.type, getPhoneFromStorage);
}

// Set demo data
function* startSetDemoData() {
  yield takeLatest(setDemoData.type, onSetDemoData);
}

// Join free demo class
function* joinClass() {
  yield takeLatest(joinFreeClass.type, handleJoinClass);
}

// Save user rating for free class
function* userRating() {
  yield takeLatest(saveRating.type, saveUserRating);
}

// Check for rating from local storage
function* checkRatingAsync() {
  yield takeLatest(checkForRating.type, checkRatingFromLocalStorage);
}

// Mark need more info
function* markNeedMoreInfo() {
  yield takeLatest(markNMI.type, handleNMI);
}

// Assign demo
function* joinDemoStart() {
  yield takeLatest(joinDemo.type, handleJoinDemo);
}

// main saga
export function* joinDemoSaga() {
  yield all([
    call(demoBookingDetailsFromPhone),
    call(demoBookingDetailsFromId),
    call(startGetPhoneAsync),
    call(startSetDemoData),
    call(joinClass),
    call(userRating),
    call(checkRatingAsync),
    call(markNeedMoreInfo),
    call(joinDemoStart),
  ]);
}
