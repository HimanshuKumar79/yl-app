/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import notifee, {
  EventType,
  AndroidImportance,
  AndroidStyle,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {
  displayRemarketingNotification,
  displayReminderNotification,
} from './src/utils/notifications';
import {BASE_URL} from '@env';

const CAPTURE_NOTIFICATION_URL = `${BASE_URL}/admin/messages/captureNotificationClicks`;

notifee.onBackgroundEvent(async ({type, detail}) => {
  try {
    const notification = detail.notification;

    if (type === EventType.PRESS) {
      if (notification.data.type) {
        if (notification.data.type === 'reminders') {
          const slotId = notification.data.slotId;
          const templateName = notification.data.templateName;
          console.log(slotId, templateName);
          const res = await fetch(CAPTURE_NOTIFICATION_URL, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({slotId, templateName, type: 'reminders'}),
          });

          console.log('response=', await res.json());
        } else if (notification.data.type === 'remarketing') {
          console.log(notification.data.notificationId);
          const res = await fetch(CAPTURE_NOTIFICATION_URL, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              notificationId: notification.data.notificationId,
              type: 'remarketing',
            }),
          });

          console.log(await res.json());
        }
      }
      notifee.cancelNotification(notification.id);
    }
  } catch (error) {
    console.log('BACKGROUND_NOTIFICATION_ERROR: ' + error);
  }
});

messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    const message = remoteMessage.data;
    const notification = {
      android: {
        sound: 'default',
        smallIcon: 'ic_small_icon',
        importance: AndroidImportance.HIGH,
        largeIcon: require('./src/assets/images/spinner.png'),
        pressAction: {
          id: 'open_app',
          launchActivity: 'default',
        },
      },
    };

    if (message?.image) {
      notification.android.style = {
        type: AndroidStyle.BIGPICTURE,
        picture: message.image,
        largeIcon: null,
      };
    }

    if (message?.largeText) {
      notification.android.style = {
        type: AndroidStyle.BIGTEXT,
        text: message.largeText,
      };
    }

    if (message?.title) {
      notification.title = message.title;
      notification.body = message.body;
      notification.data = message;
    }

    console.log('payload', notification);
    if (message?.type === 'remarketing') {
      await displayRemarketingNotification(notification);
    } else if (message?.type === 'reminders') {
      await displayReminderNotification(notification);
    }
  } catch (error) {
    console.log('BACKGROUND_NOTIFICATION_ERROR=', error);
  }
});

AppRegistry.registerComponent(appName, () => App);
