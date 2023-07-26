import React, {useState} from 'react';
import {StyleSheet, View, Pressable, Image} from 'react-native';
import TextWrapper from './text-wrapper.component';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS} from '../assets/theme/theme';
import CustomerSupportActions from './customer-support-actions';

const Icons = (name, focused) => {
  switch (name) {
    case 'Drawer':
      return (
        <Image
          source={require('../assets/images/spinner.png')}
          style={{width: 36, height: 36, objectFit: 'contain'}}
        />
      );
    case 'Account':
      return (
        <MIcon
          name="account-circle"
          size={28}
          color={focused ? COLORS.pgreen : '#222'}
        />
      );
    default:
      return;
  }
};

function Tabbar({state, descriptors, navigation}) {
  const [currentTab, setCurrentTab] = useState('drawer');
  const [actions, setActions] = useState(false);

  const ScreenIcon = ({name, focused}) => {
    const icon = Icons(name, focused);
    return icon;
  };

  const handleActions = () => {
    setCurrentTab('contact');
    setActions(true);
  };

  return (
    <>
      <View style={styles.tabbar}>
        {state.routes.map(route => {
          const {options} = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          // const isFocused = state.index === index;
          const isFocused = currentTab === route.name.toLowerCase();

          const onPress = name => {
            setCurrentTab(name.toLowerCase());
            navigation.navigate(name);
          };

          if (route.name === 'Contact') {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? {selected: true} : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={handleActions}
                style={{flex: 1, alignItems: 'center'}}>
                <MIcon
                  name="headset"
                  size={24}
                  color={isFocused ? COLORS.pgreen : '#222'}
                />
                <TextWrapper
                  fw="600"
                  fs={14}
                  color={isFocused ? COLORS.pgreen : '#222'}>
                  {label}
                </TextWrapper>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => onPress(route.name)}
              style={{flex: 1, alignItems: 'center'}}>
              <ScreenIcon name={route.name} focused={isFocused} />
              <TextWrapper
                fw="600"
                fs={14}
                color={isFocused ? COLORS.pgreen : '#222'}>
                {label}
              </TextWrapper>
            </Pressable>
          );
        })}
      </View>
      <CustomerSupportActions
        visible={actions}
        onClose={() => setActions(false)}
      />
    </>
  );
}

export default Tabbar;

const styles = StyleSheet.create({
  tabbar: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});