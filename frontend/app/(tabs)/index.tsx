import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState, useEffect } from "react";
import { StyleSheet, Text, View, Dimensions, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SQUARE_SIZE = Math.min(width, height) * 0.8;
const OFFSET = SQUARE_SIZE / 2;

type AnalysisState = {
  status: 'idle' | 'loading' | 'complete';
  message?: string;
};

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: 'idle' });

  useEffect(() => {
    requestPermission();
  }, []);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
      </View>
    );
  }

  const takePicture = async () => {
    try {
      const photo = await ref.current?.takePictureAsync();
      setUri(photo?.uri);
      
      if (photo?.uri) {
        setAnalysisState({ status: 'loading' });
        
        const formData = new FormData();
        formData.append('file', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'photo.jpg'
        } as any);

        const response = await fetch('http://192.168.29.106:8000/analyze', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });

        const result = await response.json();
        setAnalysisState({ 
          status: 'complete', 
          message: result.message 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setAnalysisState({ 
        status: 'complete', 
        message: 'Error analyzing image' 
      });
    }
  };

  const toggleFacing = () => {
    setFacing(prev => (prev === "back" ? "front" : "back"));
  };

  const renderPicture = () => {
    return (
      <View style={styles.previewContainer}>
        <Image
          source={{ uri }}
          contentFit="contain"
          style={styles.preview}
        />
        <Pressable 
          style={styles.retakeButton} 
          onPress={() => setUri(null)}
        >
          <Text style={styles.retakeText}>Retake</Text>
        </Pressable>
      </View>
    );
  };

  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={ref}
        facing={facing}
      >
        <View style={styles.squareFrame} />
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={takePicture}>
            <View style={styles.shutterBtn}>
              <View style={styles.shutterBtnInner} />
            </View>
          </Pressable>
          <Pressable style={styles.button} onPress={toggleFacing}>
            <Ionicons name="camera-reverse" size={30} color="white" />
          </Pressable>
        </View>
      </CameraView>
    );
  };

  const renderAnalysis = () => {
    return (
      <View style={styles.analysisContainer}>
        {analysisState.status === 'loading' ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analyzing image with AI...</Text>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <Image
              source={{ uri }}
              contentFit="contain"
              style={styles.analysisImage}
            />
            <ScrollView style={styles.scrollContainer}>
              <Text style={styles.analysisText}>
                {analysisState.message}
              </Text>
            </ScrollView>
            <Pressable 
              style={styles.backButton} 
              onPress={() => {
                setUri(null);
                setAnalysisState({ status: 'idle' });
              }}
            >
              <Text style={styles.backButtonText}>Take Another Photo</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {analysisState.status !== 'idle' ? renderAnalysis() : (
        uri ? renderPicture() : renderCamera()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtn: {
    backgroundColor: 'transparent',
    borderWidth: 5,
    borderColor: 'white',
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: 'white',
  },
  squareFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    transform: [
      { translateX: -OFFSET }, 
      { translateY: -OFFSET }
    ],
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  previewContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  preview: {
    width: '100%',
    flex: 1,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 40,
    padding: 20,
  },
  retakeText: {
    color: 'white',
    fontSize: 18,
  },
  analysisContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  analysisImage: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
    marginVertical: 20,
  },
  analysisText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    padding: 16,
  },
  backButton: {
    padding: 15,
    backgroundColor: '#444',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
