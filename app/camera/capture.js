import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useState, useRef } from "react";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import * as MediaLibrary from "expo-media-library";

export default function Capture() {
  const [facing, setFacing] = useState(CameraType.back);
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const cameraRef = useRef(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ textAlign: 'center', marginBottom: 16 }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 8 }}
          onPress={requestPermission}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo?.uri) {
          router.push({
            pathname: "/camera/review",
            params: { photoUri: photo.uri }
          });
        }
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
        console.error(error);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'transparent', 
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingBottom: 50
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              padding: 20,
              borderRadius: 50,
              marginHorizontal: 20
            }}
            onPress={toggleCameraFacing}
          >
            <Text style={{ color: 'white', fontSize: 18 }}>🔄</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 50,
              marginHorizontal: 20
            }}
            onPress={handleTakePicture}
          >
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'white',
              borderWidth: 4,
              borderColor: '#007AFF'
            }} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              padding: 20,
              borderRadius: 50,
              marginHorizontal: 20
            }}
            onPress={() => router.back()}
          >
            <Text style={{ color: 'white', fontSize: 18 }}>❌</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
