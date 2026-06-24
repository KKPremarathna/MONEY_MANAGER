import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../src/AppContext';
import Text from '../components/Text';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width * 0.75; // Slider takes 75% of screen width

export default function FontSize() {
  const { colors, fontSizeMode, setFontSizeMode } = useAppContext();
  const navigation = useNavigation();

  // Map size mode to numeric indices: small = 0, medium = 1, large = 2
  const getIndex = (mode) => {
    if (mode === 'small') return 0;
    if (mode === 'large') return 2;
    return 1;
  };

  const animValue = useRef(new Animated.Value(getIndex(fontSizeMode))).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: getIndex(fontSizeMode),
      useNativeDriver: false, // Left position animation requires false
      bounciness: 8,
    }).start();
  }, [fontSizeMode]);

  // Interpolate knob position across the track
  const knobLeft = animValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, SLIDER_WIDTH / 2, SLIDER_WIDTH],
  });

  const handleSelect = (index) => {
    if (index === 0) setFontSizeMode('small');
    else if (index === 1) setFontSizeMode('medium');
    else if (index === 2) setFontSizeMode('large');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Font Size</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Preview Area */}
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview Text</Text>
          <Text style={[styles.previewText, { color: colors.text }]}>
            Drag or tap the slider below to change the font size of the application. 
            This will make it easier to read transactions, categories, and settings.
          </Text>
        </View>

        {/* Step Slider Component */}
        <View style={[styles.sliderContainer, { width: SLIDER_WIDTH }]}>
          {/* Main Track Line */}
          <View style={[styles.trackLine, { backgroundColor: colors.border }]} />

          {/* Step ticks/dots */}
          <View style={styles.ticksRow}>
            {[0, 1, 2].map((idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.stepTouchArea}
                onPress={() => handleSelect(idx)}
                activeOpacity={0.7}
              >
                <View style={[styles.tickDot, { backgroundColor: colors.border }]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sliding Knob */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.knob,
              {
                left: knobLeft,
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
          />
        </View>

        {/* Step Indicator Letters */}
        <View style={[styles.labelsContainer, { width: SLIDER_WIDTH + 30 }]}>
          <TouchableOpacity onPress={() => handleSelect(0)} style={styles.labelButton} activeOpacity={0.7}>
            <Text style={[styles.sizeIndicator, { fontSize: 13, color: fontSizeMode === 'small' ? colors.primary : colors.textSecondary }]}>A</Text>
            <Text style={[styles.sizeText, { color: colors.textSecondary }]}>Small</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleSelect(1)} style={styles.labelButton} activeOpacity={0.7}>
            <Text style={[styles.sizeIndicator, { fontSize: 17, color: fontSizeMode === 'medium' ? colors.primary : colors.textSecondary }]}>A</Text>
            <Text style={[styles.sizeText, { color: colors.textSecondary }]}>Default</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleSelect(2)} style={styles.labelButton} activeOpacity={0.7}>
            <Text style={[styles.sizeIndicator, { fontSize: 22, color: fontSizeMode === 'large' ? colors.primary : colors.textSecondary }]}>A</Text>
            <Text style={[styles.sizeText, { color: colors.textSecondary }]}>Large</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  previewCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 60,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewText: {
    fontSize: 15,
    lineHeight: 22,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  trackLine: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  ticksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    zIndex: 1,
  },
  stepTouchArea: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    transform: [{ translateX: -12 }], // Center knob on the step points
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  labelButton: {
    alignItems: 'center',
    flex: 1,
  },
  sizeIndicator: {
    fontWeight: 'bold',
    height: 30,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  sizeText: {
    fontSize: 11,
    marginTop: 4,
  },
});
