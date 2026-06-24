import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useAppContext } from '../src/AppContext';

export default function Text(props) {
  const { fontSizeMode } = useAppContext();
  
  // Calculate scale factor: Small = 80%, Default = 100%, Large = 120%
  const scale = fontSizeMode === 'small' ? 0.8 : fontSizeMode === 'large' ? 1.2 : 1.0;

  let scaledStyle = props.style;

  if (props.style) {
    const flat = StyleSheet.flatten(props.style);
    if (flat && typeof flat.fontSize === 'number') {
      const newFontSize = Math.round(flat.fontSize * scale);
      const newStyle = { fontSize: newFontSize };
      
      if (flat.lineHeight) {
        newStyle.lineHeight = Math.round(flat.lineHeight * scale);
      }
      
      scaledStyle = [props.style, newStyle];
    }
  }

  return <RNText {...props} style={scaledStyle} />;
}
