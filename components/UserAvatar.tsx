import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Colors from '@/constants/colors';

interface UserAvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  showBorder?: boolean;
}

export default function UserAvatar({ 
  name, 
  imageUrl, 
  size = 40,
  showBorder = false,
}: UserAvatarProps) {
  // Get initials from name
  const getInitials = () => {
    if (!name) return '';
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.primaryLight,
      overflow: 'hidden',
      borderWidth: showBorder ? 2 : 0,
      borderColor: Colors.primary,
    },
    initials: {
      color: Colors.primary,
      fontSize: size * 0.4,
      fontWeight: 'bold',
    },
    image: {
      width: '100%',
      height: '100%',
    },
  });
  
  return (
    <View style={styles.container}>
      {imageUrl ? (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.image} 
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.initials}>{getInitials()}</Text>
      )}
    </View>
  );
}