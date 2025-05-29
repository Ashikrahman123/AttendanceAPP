import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Button,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  Platform,
  NativeEventEmitter,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import * as RNFS from "react-native-fs";
import FaceSDK, {
  Enum,
  FaceCaptureResponse,
  MatchFacesResponse,
  MatchFacesRequest,
  MatchFacesImage,
  InitConfig,
  InitResponse,
  LivenessResponse,
  LivenessNotification,
} from "@regulaforensics/react-native-face-api";

export default class FaceComparisonScreen extends React.Component {
  state = {
    img1: {
      uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s",
    },
    img2: {
      uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s",
    },
    similarity: "nil",
  };

  image1 = new MatchFacesImage();
  image2 = new MatchFacesImage();

  componentDidMount() {
    const eventManager = new NativeEventEmitter(FaceSDK);
    eventManager.addListener("livenessNotificationEvent", (data) => {
      const notification = LivenessNotification.fromJson(JSON.parse(data));
      console.log("LivenessStatus: " + notification.status);
    });

    const onInit = (json) => {
      const response = InitResponse.fromJson(JSON.parse(json));
      if (!response.success) {
        console.log(response.error.code);
        console.log(response.error.message);
      } else {
        console.log("Init complete");
      }
    };

    const licPath =
      Platform.OS === "ios"
        ? RNFS.MainBundlePath + "/license/regula.license"
        : "regula.license";
    const readFile =
      Platform.OS === "ios" ? RNFS.readFile : RNFS.readFileAssets;

    readFile(licPath, "base64")
      .then((license) => {
        const config = new InitConfig();
        config.license = license;
        FaceSDK.initialize(config, onInit, (e) => {
          console.error(e);
        });
      })
      .catch(() => {
        FaceSDK.initialize(null, onInit, (e) => {
          console.error(e);
        });
      });
  }

  pickImage = (first) => {
    Alert.alert(
      "Select option",
      "",
      [
        {
          text: "Use gallery",
          onPress: () =>
            launchImageLibrary(
              {
                mediaType: "photo",
                selectionLimit: 1,
                includeBase64: true,
              },
              (response) => {
                if (response.assets == undefined) return;
                this.setImage(
                  first,
                  response.assets[0].base64,
                  Enum.ImageType.PRINTED,
                );
              },
            ),
        },
        {
          text: "Use camera",
          onPress: () =>
            FaceSDK.startFaceCapture(
              null,
              (json) => {
                const response = FaceCaptureResponse.fromJson(JSON.parse(json));
                if (response.image && response.image.image) {
                  this.setImage(
                    first,
                    response.image.image,
                    Enum.ImageType.LIVE,
                  );
                }
              },
              (e) => {
                console.error(e);
              },
            ),
        },
      ],
      { cancelable: true },
    );
  };

  setImage = (first, base64, type) => {
    if (base64 == null) return;

    if (first) {
      this.image1 = new MatchFacesImage();
      this.image1.image = base64;
      this.image1.imageType = type;
      this.setState({ img1: { uri: "data:image/png;base64," + base64 } });
    } else {
      this.image2 = new MatchFacesImage();
      this.image2.image = base64;
      this.image2.imageType = type;
      this.setState({ img2: { uri: "data:image/png;base64," + base64 } });
    }
  };

  matchFaces = () => {
    if (!this.image1.image || !this.image2.image) return;

    this.setState({ similarity: "Processing..." });
    const request = new MatchFacesRequest();
    request.images = [this.image1, this.image2];

    FaceSDK.matchFaces(
      request,
      null,
      (json) => {
        const response = MatchFacesResponse.fromJson(JSON.parse(json));
        this.setState({
          similarity:
            response.results.length > 0
              ? (response.results[0].similarity * 100).toFixed(2) + "%"
              : "No match found",
        });
      },
      (e) => {
        this.setState({ similarity: e });
      },
    );
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 15 }}>
          <TouchableOpacity
            onPress={() => this.pickImage(true)}
            style={{ alignItems: "center" }}
          >
            <Image
              source={this.state.img1}
              resizeMode="contain"
              style={{ height: 150, width: 150 }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => this.pickImage(false)}
            style={{ alignItems: "center" }}
          >
            <Image
              source={this.state.img2}
              resizeMode="contain"
              style={{ height: 150, width: 150 }}
            />
          </TouchableOpacity>
          <Button title="Compare Faces" onPress={this.matchFaces} />
          <Text>Similarity: {this.state.similarity}</Text>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
