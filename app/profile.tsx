{user.role !== 'admin' && (
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => {
                  if (registeredFace) {
                    // Show preview of registered face
                    Alert.alert(
                      'Face ID Preview',
                      'Your registered Face ID',
                      [
                        { text: 'OK' }
                      ],
                      {
                        customImage: registeredFace
                      }
                    );
                  }
                }}
              >
                <View style={styles.settingsLeft}>
                  <View
                    style={[
                      styles.settingsIcon,
                      { backgroundColor: colors.warning + "30" },
                    ]}
                  >
                    <Camera size={20} color={colors.warning} />
                  </View>
                  <Text style={[styles.settingsText, { color: colors.text }]}>
                    Preview Registered Face
                  </Text>
                </View>
                {registeredFace ? (
                  <View
                    style={[
                      styles.registeredBadge,
                      { backgroundColor: colors.success + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.registeredBadgeText,
                        { color: colors.success },
                      ]}
                    >
                      Registered
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.notRegisteredText, { color: colors.error }]}>
                    Not Registered
                  </Text>
                )}
              </TouchableOpacity>
            )}