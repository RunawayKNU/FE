import React, {useState} from "react";
import {Text, TouchableOpacity, View} from "react-native";
import NaverMapComponent from "@/components/custom/NaverMapComponent";

const MapScreen = () => {
    const [showMarkers, setShowMarkers] = useState(true)

    return (
        <View style={{flex: 1}}>
            <NaverMapComponent showMarkers={showMarkers}/>
            <TouchableOpacity onPress={() => setShowMarkers(prev => !prev)}>
                <Text>마커 {showMarkers ? '숨기기' : '보이기'}</Text>
            </TouchableOpacity>
        </View>
    )
}
export default MapScreen;