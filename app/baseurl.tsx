
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useBaseUrl } from '@/context/BaseUrlContext';
import { router } from 'expo-router';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function BaseUrlScreen() {
  const [url, setUrl] = useState('');
  const { setBaseUrl } = useBaseUrl();

  const handleSubmit = async () => {
    if (!url.trim()) return;
    try {
      await setBaseUrl(url.trim());
      router.replace('/(auth)');
    } catch (error) {
      console.error('Failed to save base URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Input
        label="Base URL"
        placeholder="Enter server URL"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      <Button 
        title="Save Base URL" 
        onPress={handleSubmit}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  button: {
    marginTop: 20,
  }
});
