import React, {useEffect, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {NaverMapView, NaverMapMarkerOverlay} from '@mj-studio/react-native-naver-map';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';

interface NaverMapComponentProps {
    style?: any;
    initialLocation?: {
        latitude: number;
        longitude: number;
        zoom: number;
    };
}

interface AedInfo {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

const NaverMapComponent: React.FC<NaverMapComponentProps> = ({
                                                                 style,
                                                                 initialLocation = {
                                                                     latitude: 37.571203,
                                                                     longitude: 126.978974,
                                                                     zoom: 15
                                                                 },
                                                             }) => {
    const [aedData, setAedData] = useState<AedInfo[]>([]);
    const [showMarkers, setShowMarkers] = useState(true);

    useEffect(() => {
        const fetchAedData = async () => {
            try {
                const response = await axios.get('http://openapi.seoul.go.kr:8088/6f7641597a72696335384a71746851/xml/tbEmgcAedInfo/1/1000/');

                // fast-xml-parser를 사용해 XML 파싱
                const parser = new XMLParser();
                const jsonObj = parser.parse(response.data);

                // 응답 데이터 구조 확인을 위한 로그

                // tbEmgcAedInfo가 존재하는지 확인
                if (!jsonObj.tbEmgcAedInfo || !jsonObj.tbEmgcAedInfo.row) {
                    console.error('tbEmgcAedInfo나 row 데이터가 없습니다.');
                    return;
                }

                const rows = Array.isArray(jsonObj.tbEmgcAedInfo.row)
                    ? jsonObj.tbEmgcAedInfo.row
                    : [jsonObj.tbEmgcAedInfo.row];

                const parsedData = rows.map((row: any) => ({
                    name: row.BUILDPLACE || '',
                    address: row.BUILDADDRESS || '',
                    latitude: parseFloat(row.WGS84LAT || '0'),
                    longitude: parseFloat(row.WGS84LON || '0'),
                }));

                setAedData(parsedData);
            } catch (error) {
                console.error('AED 데이터 불러오기 실패:', error);
            }
        };

        fetchAedData();
    }, []);

    return (
        <View style={[styles.container, style]}>
            <NaverMapView
                style={styles.map}
                initialCamera={{
                    latitude: initialLocation.latitude,
                    longitude: initialLocation.longitude,
                    zoom: initialLocation.zoom,
                }}
            >
                {showMarkers && aedData.map((aed, index) => (
                    <NaverMapMarkerOverlay
                        key={index}
                        latitude={aed.latitude}
                        longitude={aed.longitude}
                        caption={{
                            text: aed.name,
                            align: 'Bottom',
                        }}
                        onTap={() => console.log(aed.address)}
                    />
                ))}
            </NaverMapView>
            <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowMarkers(!showMarkers)}
            >
                <Text style={{ fontSize: 24, opacity: showMarkers ? 1 : 0.4 }}>
                    ❤️
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    toggleButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 10,
        elevation: 5,
    },
});

export default NaverMapComponent;