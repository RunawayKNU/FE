import React, {useState} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import NaverMapComponent from "@/components/custom/NaverMapComponent";

const MapScreen = () => {
    const [showAedMarkers, setShowAedMarkers] = useState(true)
    const [showColdMarkers, setShowColdMarkers] = useState(true)
    const [showHotMarkers, setShowHotMarkers] = useState(true)

    return (

            <View style={{flex: 1}}>
                <NaverMapComponent
                    showAedMarkers={showAedMarkers}
                    showColdMarkers={showColdMarkers}
                    showHotMarkers={showHotMarkers}
                />
                <TouchableOpacity onPress={() => setShowAedMarkers(prev => !prev)}>
                    <Text>AED 마커 {showAedMarkers ? '숨기기' : '보이기'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowColdMarkers(prev => !prev)}>
                    <Text>한파 대피소 마커 {showColdMarkers ? '숨기기' : '보이기'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowHotMarkers(prev => !prev)}>
                    <Text>한파 대피소 마커 {showHotMarkers ? '숨기기' : '보이기'}</Text>
                </TouchableOpacity>
            </View>
    )
}
export default MapScreen;