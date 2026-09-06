/*
=========================================
矿山运输管理系统 V1.0
GPS + 电子围栏
=========================================
*/


/*
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

这里必须改成你矿山的真实坐标。

latitude = 纬度
longitude = 经度
radius = 电子围栏半径（米）

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
*/


const MineAreas = {

    load: {

        id: "LOAD_01",

        name: "1号装载区",

        latitude: 42.123456,

        longitude: 106.123456,

        radius: 50

    },


    unload: {

        id: "UNLOAD_01",

        name: "1号卸载区",

        latitude: 42.124000,

        longitude: 106.124000,

        radius: 50

    }

};



const GPSManager = {

    latitude: null,

    longitude: null,

    accuracy: null,

    timestamp: null,

    currentArea: "UNKNOWN",

    loadDistance: null,

    unloadDistance: null,

    watchId: null,


    start(callback, errorCallback) {

        if (
            !navigator.geolocation
        ) {

            errorCallback(
                "当前设备不支持GPS定位"
            );

            return;

        }


        this.watchId =
            navigator.geolocation
                .watchPosition(

                    position => {

                        this.latitude =
                            position
                                .coords
                                .latitude;


                        this.longitude =
                            position
                                .coords
                                .longitude;


                        this.accuracy =
                            position
                                .coords
                                .accuracy;


                        this.timestamp =
                            position.timestamp;


                        this.detectArea();


                        if (callback) {

                            callback(
                                this.getState()
                            );

                        }

                    },


                    error => {

                        let message =
                            "GPS定位失败";


                        if (error.code === 1) {

                            message =
                                "位置权限被拒绝，请允许浏览器访问位置";

                        }


                        else if (
                            error.code === 2
                        ) {

                            message =
                                "暂时无法获取GPS位置";

                        }


                        else if (
                            error.code === 3
                        ) {

                            message =
                                "GPS定位超时";

                        }


                        if (errorCallback) {

                            errorCallback(
                                message
                            );

                        }

                    },


                    {
                        enableHighAccuracy: true,

                        maximumAge: 3000,

                        timeout: 15000
                    }

                );

    },


    stop() {

        if (
            this.watchId !== null
        ) {

            navigator
                .geolocation
                .clearWatch(
                    this.watchId
                );

            this.watchId =
                null;

        }

    },


    getDistance(
        lat1,
        lon1,
        lat2,
        lon2
    ) {

        const R =
            6371000;


        const radLat1 =
            lat1 *
            Math.PI /
            180;


        const radLat2 =
            lat2 *
            Math.PI /
            180;


        const deltaLat =
            (lat2 - lat1) *
            Math.PI /
            180;


        const deltaLon =
            (lon2 - lon1) *
            Math.PI /
            180;


        const a =

            Math.sin(
                deltaLat / 2
            ) ** 2

            +

            Math.cos(
                radLat1
            )

            *

            Math.cos(
                radLat2
            )

            *

            Math.sin(
                deltaLon / 2
            ) ** 2;


        const c =

            2 *

            Math.atan2(

                Math.sqrt(a),

                Math.sqrt(1 - a)

            );


        return R * c;

    },


    detectArea() {

        if (
            this.latitude === null ||
            this.longitude === null
        ) {

            this.currentArea =
                "UNKNOWN";

            return;

        }


        this.loadDistance =
            this.getDistance(

                this.latitude,

                this.longitude,

                MineAreas.load.latitude,

                MineAreas.load.longitude

            );


        this.unloadDistance =
            this.getDistance(

                this.latitude,

                this.longitude,

                MineAreas.unload.latitude,

                MineAreas.unload.longitude

            );


        if (
            this.loadDistance <=
            MineAreas.load.radius
        ) {

            this.currentArea =
                "LOAD";

        }


        else if (
            this.unloadDistance <=
            MineAreas.unload.radius
        ) {

            this.currentArea =
                "UNLOAD";

        }


        else {

            this.currentArea =
                "ROAD";

        }

    },


    getState() {

        return {

            latitude:
                this.latitude,

            longitude:
                this.longitude,

            accuracy:
                this.accuracy,

            timestamp:
                this.timestamp,

            area:
                this.currentArea,

            loadDistance:
                this.loadDistance,

            unloadDistance:
                this.unloadDistance

        };

    }

};