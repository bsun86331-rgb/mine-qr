/*
=========================================
矿山运输管理系统 V1.2
GPS + Supabase统一电子围栏
=========================================
*/


const DEFAULT_AREAS = {

    load: {

        id:
            "LOAD_01",

        name:
            "1号装载区",

        latitude:
            42.123456,

        longitude:
            106.123456,

        radius:
            50

    },


    unload: {

        id:
            "UNLOAD_01",

        name:
            "1号卸载区",

        latitude:
            42.124000,

        longitude:
            106.124000,

        radius:
            50

    }

};



const AREA_CACHE_KEY =
    "mineAreasCache";


let MineAreas = {

    load:
        {
            ...DEFAULT_AREAS.load
        },

    unload:
        {
            ...DEFAULT_AREAS.unload
        }

};



const AreaManager = {

    /*
    =========================================
    初始化区域
    =========================================
    */

    async initialize() {

        /*
        先读取本地缓存
        避免没网时完全不能工作
        */

        this.loadCache();


        /*
        然后从Supabase读取最新区域
        */

        try {

            const areas =
                await SupabaseManager
                    .getAreas();


            this.applyServerAreas(
                areas
            );


            this.saveCache();


            return true;

        }


        catch (error) {

            console.error(
                "读取在线电子围栏失败：",
                error
            );


            return false;

        }

    },


    /*
    =========================================
    服务器数据应用到 MineAreas
    =========================================
    */

    applyServerAreas(areas) {

        if (!Array.isArray(areas)) {

            return;

        }


        const load =
            areas.find(
                item =>
                    item.id ===
                    "LOAD_01"
            );


        const unload =
            areas.find(
                item =>
                    item.id ===
                    "UNLOAD_01"
            );


        if (load) {

            MineAreas.load = {

                id:
                    load.id,

                name:
                    load.name,

                latitude:
                    Number(
                        load.latitude
                    ),

                longitude:
                    Number(
                        load.longitude
                    ),

                radius:
                    Number(
                        load.radius
                    )

            };

        }


        if (unload) {

            MineAreas.unload = {

                id:
                    unload.id,

                name:
                    unload.name,

                latitude:
                    Number(
                        unload.latitude
                    ),

                longitude:
                    Number(
                        unload.longitude
                    ),

                radius:
                    Number(
                        unload.radius
                    )

            };

        }

    },


    /*
    =========================================
    保存缓存
    =========================================
    */

    saveCache() {

        localStorage.setItem(

            AREA_CACHE_KEY,

            JSON.stringify(
                MineAreas
            )

        );

    },


    /*
    =========================================
    读取缓存
    =========================================
    */

    loadCache() {

        const saved =
            localStorage.getItem(
                AREA_CACHE_KEY
            );


        if (!saved) {

            return;

        }


        try {

            const data =
                JSON.parse(saved);


            if (
                data.load &&
                data.unload
            ) {

                MineAreas = data;

            }

        }


        catch (error) {

            console.warn(
                "电子围栏缓存读取失败",
                error
            );

        }

    },


    /*
    =========================================
    在线设置装载区
    =========================================
    */

    async saveLoadArea(
        latitude,
        longitude,
        radius
    ) {

        await SupabaseManager
            .saveLoadArea(

                latitude,

                longitude,

                radius

            );


        MineAreas.load = {

            id:
                "LOAD_01",

            name:
                "1号装载区",

            latitude:
                latitude,

            longitude:
                longitude,

            radius:
                radius

        };


        this.saveCache();

    },


    /*
    =========================================
    在线设置卸载区
    =========================================
    */

    async saveUnloadArea(
        latitude,
        longitude,
        radius
    ) {

        await SupabaseManager
            .saveUnloadArea(

                latitude,

                longitude,

                radius

            );


        MineAreas.unload = {

            id:
                "UNLOAD_01",

            name:
                "1号卸载区",

            latitude:
                latitude,

            longitude:
                longitude,

            radius:
                radius

        };


        this.saveCache();

    },


    /*
    =========================================
    手动重新同步服务器
    =========================================
    */

    async refresh() {

        const areas =
            await SupabaseManager
                .getAreas();


        this.applyServerAreas(
            areas
        );


        this.saveCache();


        return MineAreas;

    },


    getLoadArea() {

        return MineAreas.load;

    },


    getUnloadArea() {

        return MineAreas.unload;

    }

};



const GPSManager = {

    latitude:
        null,

    longitude:
        null,

    accuracy:
        null,

    timestamp:
        null,

    currentArea:
        "UNKNOWN",

    loadDistance:
        null,

    unloadDistance:
        null,

    watchId:
        null,


    start(
        callback,
        errorCallback
    ) {

        if (
            !navigator.geolocation
        ) {

            errorCallback(
                "当前设备不支持GPS定位"
            );

            return;

        }


        this.watchId =

            navigator
                .geolocation
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
                            position
                                .timestamp;


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


                        if (
                            error.code === 1
                        ) {

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


                        if (
                            errorCallback
                        ) {

                            errorCallback(
                                message
                            );

                        }

                    },


                    {

                        enableHighAccuracy:
                            true,

                        maximumAge:
                            3000,

                        timeout:
                            15000

                    }

                );

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

                MineAreas
                    .load
                    .latitude,

                MineAreas
                    .load
                    .longitude

            );


        this.unloadDistance =
            this.getDistance(

                this.latitude,

                this.longitude,

                MineAreas
                    .unload
                    .latitude,

                MineAreas
                    .unload
                    .longitude

            );


        if (

            this.loadDistance <=

            MineAreas
                .load
                .radius

        ) {

            this.currentArea =
                "LOAD";

        }


        else if (

            this.unloadDistance <=

            MineAreas
                .unload
                .radius

        ) {

            this.currentArea =
                "UNLOAD";

        }


        else {

            this.currentArea =
                "ROAD";

        }

    },


    refreshAreas() {

        this.detectArea();

    },


    getDistance(
        lat1,
        lon1,
        lat2,
        lon2
    ) {

        const R =
            6371000;


        const p1 =
            lat1 *
            Math.PI /
            180;


        const p2 =
            lat2 *
            Math.PI /
            180;


        const dLat =
            (
                lat2 -
                lat1
            ) *
            Math.PI /
            180;


        const dLon =
            (
                lon2 -
                lon1
            ) *
            Math.PI /
            180;


        const a =

            Math.sin(
                dLat / 2
            ) ** 2

            +

            Math.cos(p1) *

            Math.cos(p2) *

            Math.sin(
                dLon / 2
            ) ** 2;


        const c =

            2 *

            Math.atan2(

                Math.sqrt(a),

                Math.sqrt(
                    1 - a
                )

            );


        return R * c;

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