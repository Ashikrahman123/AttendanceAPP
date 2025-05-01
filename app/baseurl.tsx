import { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useBaseUrl } from '../context/BaseUrlContext';
import { Link, router } from 'expo-router';

export default function BaseUrlScreen() {
  const [url, setUrl] = useState('');
  const { baseUrl, setBaseUrl, isLoading } = useBaseUrl();

  useEffect(() => {
    if (baseUrl) {
      router.replace('/login');
    }
  }, [baseUrl]);

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid base URL');
      return;
    }
    try {
      await setBaseUrl(url.trim());
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to save base URL');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <TextInput
        placeholder="Enter Base URL (e.g., https://api.example.com)"
        value={url}
        onChangeText={setUrl}
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
        autoCapitalize="none"
        keyboardType="url"
      />
      <Button title="Save Base URL" onPress={handleSubmit} />
      
      <Link href="/login" style={{ marginTop: 20, textAlign: 'center' }}>
        Proceed to Login
      </Link>
    </View>
  );
}