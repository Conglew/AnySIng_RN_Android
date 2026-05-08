import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

type Props = {
  benefits: string[];
  note: string;
};

export function PaymentBenefitCard({ benefits, note }: Props) {
  return (
    <View style={styles.leftPanel}>
      <View>
        {/* <Text style={styles.logoText}>{logoText}</Text> */}
        <Image
          source={require('@/assets/images/payment-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <ImageBackground
        source={require('@/assets/images/payment-border-background.png')}
        style={styles.benefitCard}
        imageStyle={styles.benefitCardBackgroundImage}
        resizeMode="cover"
      >
        <View style={styles.benefitListBox}>
          {benefits.map((item) => (
            <Text key={item} style={styles.benefitText}>
              ・{item}
            </Text>
          ))}
        </View>

        <Text style={styles.noteText}>{note}</Text>
      </ImageBackground>

      <Image
        source={require('@/assets/images/payment-singer-front.png')}
        style={styles.singerImage}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  leftPanel: {
    width: 250,
    height: '100%',
    justifyContent: 'center',
  },

  logoText: {
    color: '#D7ECFF',
    fontSize: 30,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.5,
  },

  logoImage: {
    position: 'absolute',
    left: -90,
    bottom: -250,
    width: 768,
    height: 490,
  },

  benefitCard: {
    width: 400,
    height: 393,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    // borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    backgroundColor: 'rgba(3, 14, 35, 0.5)',
    zIndex: 2,
    marginLeft: 25,
    marginBottom: 200,
  },

  benefitCardBackgroundImage: {
    borderRadius: 8,
  },

  benefitListBox: {
    width: 354,
    height: 240,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },

  benefitText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 48,
  },

  noteText: {
    width: 273,
    height: 48,
    marginTop: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 48,
  },

  singerImage: {
    position: 'absolute',
    left: -115,
    bottom: -120,
    width: 456.14,
    height: 433,
    zIndex: 99,
  },
});
