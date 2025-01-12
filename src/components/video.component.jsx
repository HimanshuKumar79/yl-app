import React, {useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import Icon from './icon.component';
import {COLORS} from '../utils/constants/colors';
import Modal from './modal.component';
import TextWrapper from './text-wrapper.component';
import {FONTS} from '../utils/constants/fonts';

const {width: deviceWidth, height: deviceHeight} = Dimensions.get('window');

const VideoPlayer = ({
  uri,
  poster,
  thumbnailText,
  width = 135,
  aspectRatio,
}) => {
  const videoRef = useRef();
  const thumbRef = useRef();
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoding] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isEnded2, setIsEnded2] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);

  const onLoadStart = () => {
    setLoding(true);
  };

  const onReadyForDisplay = () => {
    setLoding(false);
  };

  const onOpen = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const onMute = () => {
    setMuted(!muted);
  };

  const onBack = () => {
    setVisible(false);
  };

  const onEnd = () => {
    setIsEnded(true);
  };
  const onEnd2 = () => {
    setIsEnded2(true);
  };

  return (
    <>
      <Pressable
        style={[styles.container, {width: width, aspectRatio}]}
        onPress={onOpen}>
        <Video
          ref={thumbRef}
          source={{uri}}
          style={{
            width: '100%',
            height: '100%',
          }}
          focusable={false}
          muted={true}
          onEnd={onEnd}
          resizeMode="cover"
          disableFocus={true}
          // poster={poster}
          // posterResizeMode="cover"
          paused={visible}
          onLoadStart={() => setThumbLoading(true)}
          onReadyForDisplay={() => setThumbLoading(false)}
        />
        {thumbLoading && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: '#eee',
            }}></View>
        )}
        {thumbnailText && (
          <View style={styles.poster}>
            <View
              style={{
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 16,
              }}>
              <TextWrapper
                fs={20}
                ff={FONTS.signika_semiBold}
                color={COLORS.white}>
                {thumbnailText}
              </TextWrapper>
            </View>
          </View>
        )}
      </Pressable>
      <Modal visible={visible} transparent={false} onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          {loading && (
            <ActivityIndicator
              size={'large'}
              color={COLORS.white}
              style={styles.activityIndicator}
            />
          )}
          <Video
            ref={videoRef}
            source={{uri}}
            style={{width: '100%', height: '100%', alignSelf: 'center'}}
            onLoadStart={onLoadStart}
            onReadyForDisplay={onReadyForDisplay}
            onEnd={onEnd2}
            muted={muted}
            resizeMode="contain"
          />
          <View style={styles.videoOverlay}>
            <View
              style={{
                position: 'relative',
                flex: 1,
              }}>
              <Icon
                name={'arrow-back-outline'}
                size={28}
                color={COLORS.white}
                style={{marginTop: 16, marginLeft: 16}}
                onPress={onBack}
              />
              <Icon
                name={muted ? 'volume-mute-outline' : 'volume-high-outline'}
                size={28}
                color={COLORS.white}
                style={{position: 'absolute', right: 24, bottom: 24}}
                onPress={onMute}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default React.memo(VideoPlayer);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 1,
  },
  modalContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.black,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  activityIndicator: {
    alignSelf: 'center',
    top: deviceHeight * 0.5,
    position: 'absolute',
  },
});
