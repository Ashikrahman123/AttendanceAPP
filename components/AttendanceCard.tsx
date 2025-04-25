import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { Clock, MapPin, CheckCircle, XCircle, Coffee, Timer, X } from 'lucide-react-native';
import { AttendanceRecord } from '@/types/user';
import { formatTime } from '@/utils/date-formatter';
import Colors from '@/constants/colors';

interface AttendanceCardProps {
  record: AttendanceRecord;
  isLast?: boolean;
}

export default function AttendanceCard({ record, isLast = false }: AttendanceCardProps) {
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const getActionIcon = () => {
    switch (record.type) {
      case 'check-in':
        return <CheckCircle size={16} color={Colors.primary} />;
      case 'break-start':
        return <Coffee size={16} color={Colors.warning} />;
      case 'break-end':
        return <Timer size={16} color={Colors.secondary} />;
      case 'check-out':
        return <XCircle size={16} color={Colors.success} />;
      default:
        return <Clock size={16} color={Colors.textSecondary} />;
    }
  };
  
  const getActionText = () => {
    switch (record.type) {
      case 'check-in':
        return 'Checked In';
      case 'break-start':
        return 'Started Break';
      case 'break-end':
        return 'Ended Break';
      case 'check-out':
        return 'Checked Out';
      default:
        return 'Unknown Action';
    }
  };
  
  const getActionColor = () => {
    switch (record.type) {
      case 'check-in':
        return Colors.primary;
      case 'break-start':
        return Colors.warning;
      case 'break-end':
        return Colors.secondary;
      case 'check-out':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };
  
  return (
    <View style={styles.timelineItem}>
      <View style={[
        styles.timelineDot,
        { backgroundColor: getActionColor() + '20' } // 20% opacity
      ]}>
        {getActionIcon()}
      </View>
      
      {!isLast && <View style={styles.timelineConnector} />}
      
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTime}>{formatTime(record.timestamp)}</Text>
          <Text style={[
            styles.timelineAction,
            { color: getActionColor() }
          ]}>
            {getActionText()}
          </Text>
        </View>
        
        {record.location?.address && (
          <View style={styles.locationContainer}>
            <MapPin size={12} color={Colors.textSecondary} />
            <Text style={styles.locationText}>{record.location.address}</Text>
          </View>
        )}
        
        {record.imageData && (
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => setImageModalVisible(true)}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: record.imageData }} 
              style={styles.verificationImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.viewImageText}>Tap to view</Text>
            </View>
          </TouchableOpacity>
        )}
        
        <View style={styles.verificationBadge}>
          {record.verified ? (
            <>
              <CheckCircle size={12} color={Colors.success} />
              <Text style={styles.verificationText}>Face Verified</Text>
            </>
          ) : (
            <>
              <XCircle size={12} color={Colors.warning} />
              <Text style={[styles.verificationText, { color: Colors.warning }]}>
                Manual Entry
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Full-screen image modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setImageModalVisible(false)}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Image 
            source={{ uri: record.imageData }} 
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          
          <View style={styles.imageInfoContainer}>
            <Text style={styles.imageInfoText}>
              {getActionText()} at {formatTime(record.timestamp)}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 2,
  },
  timelineConnector: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: -24,
    width: 2,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    padding: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  timelineAction: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  verificationImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    alignItems: 'center',
  },
  viewImageText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullScreenImage: {
    width: '90%',
    height: '70%',
    borderRadius: 12,
  },
  imageInfoContainer: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  imageInfoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});