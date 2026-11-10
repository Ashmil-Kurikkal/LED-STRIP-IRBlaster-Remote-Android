import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { RemoteButtonDef } from '../constants/irData';

interface RemoteButtonViewProps {
  button: RemoteButtonDef;
  mappedHex?: string | null;
  size?: number;
  showHexBadge?: boolean;
  isSelected?: boolean;
  dimUnmapped?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export const RemoteButtonView: React.FC<RemoteButtonViewProps> = ({
  button,
  mappedHex,
  size = 68,
  showHexBadge = true,
  isSelected = false,
  dimUnmapped = false,
  onPress,
  onLongPress,
}) => {
  const isMapped = Boolean(mappedHex);
  const innerSize = size - 8;

  const renderContent = () => {
    switch (button.visualType) {
      case 'brightness-up':
        return (
          <View style={styles.iconStack}>
            <Text style={[styles.arrowIcon, { fontSize: size * 0.16 }]}>▲</Text>
            <Text style={[styles.sunIcon, { fontSize: size * 0.34 }]}>☀</Text>
          </View>
        );
      case 'brightness-down':
        return (
          <View style={styles.iconStack}>
            <Text style={[styles.sunIcon, { fontSize: size * 0.34 }]}>☀</Text>
            <Text style={[styles.arrowIcon, { fontSize: size * 0.16 }]}>▼</Text>
          </View>
        );
      case 'music': {
        const musicNum = button.id.replace('MUSIC', '');
        return (
          <View style={styles.musicRow}>
            <Text
              style={[
                styles.musicNote,
                {
                  color: button.accentColor || '#F97316',
                  fontSize: size * 0.36,
                },
              ]}
            >
              ♪
            </Text>
            <Text
              style={[
                styles.musicSubscript,
                { fontSize: size * 0.19 },
              ]}
            >
              {musicNum}
            </Text>
          </View>
        );
      }
      case 'mode':
        return (
          <View
            style={[
              styles.modeInnerRing,
              {
                width: innerSize - 8,
                height: innerSize - 8,
                borderRadius: (innerSize - 8) / 2,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.modeLabel,
                {
                  color: '#E5E7EB',
                  fontSize: size * 0.19,
                },
              ]}
            >
              {button.label}
            </Text>
          </View>
        );
      default:
        return (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.buttonLabel,
              {
                color: button.textColor,
                fontSize:
                  button.label.length >= 6
                    ? size * 0.175
                    : button.label.length >= 5
                    ? size * 0.195
                    : size * 0.22,
              },
            ]}
          >
            {button.label}
          </Text>
        );
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
        style={({ pressed }): ViewStyle[] => [
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: isSelected
              ? '#38BDF8'
              : isMapped
              ? button.borderColor
              : 'rgba(156, 163, 175, 0.35)',
            borderWidth: isSelected ? 3 : 2,
            opacity: dimUnmapped && !isMapped ? 0.52 : 1,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
      >
        <View
          style={[
            styles.innerCap,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: button.bgColor,
            },
          ]}
        >
          {/* Top glossy dome reflection */}
          <View
            style={[
              styles.glossHighlight,
              {
                width: innerSize * 0.72,
                height: innerSize * 0.32,
                borderRadius: innerSize * 0.36,
              },
            ]}
          />
          {renderContent()}
        </View>
      </Pressable>

      {showHexBadge && (
        <View
          style={[
            styles.hexBadge,
            isMapped ? styles.hexBadgeMapped : styles.hexBadgeUnmapped,
          ]}
        >
          <Text
            style={[
              styles.hexBadgeText,
              isMapped ? styles.hexBadgeTextMapped : styles.hexBadgeTextUnmapped,
            ]}
          >
            {mappedHex ? mappedHex.slice(4) : '?'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111318',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 5,
    elevation: 6,
  },
  innerCap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  glossHighlight: {
    position: 'absolute',
    top: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  buttonLabel: {
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: 4,
    textShadowColor: 'rgba(255,255,255,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  modeInnerRing: {
    borderWidth: 1.5,
    borderColor: 'rgba(209, 213, 219, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  modeLabel: {
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  iconStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    color: '#111827',
    fontWeight: '900',
    lineHeight: 12,
  },
  sunIcon: {
    color: '#111827',
    fontWeight: '900',
    lineHeight: 24,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  musicNote: {
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  musicSubscript: {
    color: '#E5E7EB',
    fontWeight: '800',
    marginLeft: 2,
    marginBottom: 2,
  },
  hexBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  hexBadgeMapped: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  hexBadgeUnmapped: {
    backgroundColor: 'rgba(75, 85, 99, 0.25)',
    borderColor: 'rgba(107, 114, 128, 0.35)',
  },
  hexBadgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  hexBadgeTextMapped: {
    color: '#34D399',
  },
  hexBadgeTextUnmapped: {
    color: '#9CA3AF',
  },
});

