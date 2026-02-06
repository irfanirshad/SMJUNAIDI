import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';
import colors from '../../constants/colors';

const FormSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        {/* Input fields skeleton */}
        {[1, 2, 3, 4].map(item => (
          <View key={item} style={styles.inputContainer}>
            <Skeleton width={80} height={16} style={styles.labelSkeleton} />
            <Skeleton width="100%" height={48} borderRadius={8} />
          </View>
        ))}

        {/* Button skeleton */}
        <Skeleton
          width="100%"
          height={50}
          borderRadius={8}
          style={styles.buttonSkeleton}
        />

        {/* Footer text skeleton */}
        <View style={styles.footerContainer}>
          <Skeleton width={200} height={16} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 50,
    width: '100%',
  },
  formContainer: {
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 30,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelSkeleton: {
    marginBottom: 8,
  },
  buttonSkeleton: {
    marginTop: 10,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
});

export default FormSkeleton;
