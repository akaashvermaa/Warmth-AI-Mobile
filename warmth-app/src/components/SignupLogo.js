import { Dimensions, Image, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 600;

export default function SignupLogo({ source }) {
  return (
    <View style={styles.wrapper}>
      <Image source={source} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: isTablet ? 140 : 110,
    height: isTablet ? 140 : 110,
    borderRadius: isTablet ? 70 : 55,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: '78%',
    height: '78%',
  },
});
