/*
=========================================
矿山运输管理系统 V1.2
主程序
Supabase 联网电子围栏版
=========================================
*/

const App = {

    today: null,

    transportState: "WAIT_LOAD",

    tripCount: 0,

    currentLoad: null,

    gps: null,

    supabaseReady: false,


    /*
    =========================================
    系统初始化
    =========================================
    */

    async init() {

        this.today =
            StorageManager.initializeDay();

        this.transportState =
            StorageManager.getTransportState();

        this.tripCount =
            StorageManager.getTripCount();

        this.currentLoad =
            StorageManager.getCurrentLoad();


        document
            .getElementById("todayDate")
            .textContent =
            this.today;


        document
            .getElementById("driver")
            .value =
            StorageManager.getDriver();


        document
            .getElementById("truck")
            .value =
            StorageManager.getTruck();


        this.bindEvents();

        this.updateCount();

        this.updateTransportStatus();

        this.renderRecords();

        this.updateButtons();


        /*
        初始化 Supabase
        */

        this.showSystemMessage(
            "正在连接在线数据库..."
        );


        try {

            this.supabaseReady =
                SupabaseManager.init();


            if (this.supabaseReady) {

                const online =
                    await AreaManager.initialize();


                if (online) {

                    this.showSystemMessage(
                        "在线电子围栏同步成功，正在启动GPS..."
                    );

                } else {

                    this.showSystemMessage(
                        "在线电子围栏读取失败，正在使用本地缓存"
                    );

                }

            } else {

                AreaManager.loadCache();

                this.showSystemMessage(
                    "Supabase尚未配置，当前使用本地缓存"
                );

            }

        } catch (error) {

            console.error(
                "Supabase初始化失败：",
                error
            );

            AreaManager.loadCache();

            this.showSystemMessage(
                "数据库连接失败，当前使用本地缓存"
            );

        }


        this.renderSavedAreas();

        this.startGps();


        /*
        每分钟检查是否跨天
        */

        setInterval(
            () => {

                this.checkNewDay();

            },
            60000
        );

    },


    /*
    =========================================
    绑定按钮和输入事件
    =========================================
    */

    bindEvents() {

        document
            .getElementById("driver")
            .addEventListener(
                "input",
                () => {

                    StorageManager.setDriver(
                        this.getDriver()
                    );

                }
            );


        document
            .getElementById("truck")
            .addEventListener(
                "input",
                () => {

                    StorageManager.setTruck(
                        this.getTruck()
                    );

                }
            );


        document
            .getElementById("loadButton")
            .addEventListener(
                "click",
                () => {

                    this.confirmLoad();

                }
            );


        document
            .getElementById("unloadButton")
            .addEventListener(
                "click",
                () => {

                    this.confirmUnload();

                }
            );


        document
            .getElementById("setLoadAreaButton")
            .addEventListener(
                "click",
                async () => {

                    await this.setCurrentAsLoadArea();

                }
            );


        document
            .getElementById("setUnloadAreaButton")
            .addEventListener(
                "click",
                async () => {

                    await this.setCurrentAsUnloadArea();

                }
            );


        document
            .getElementById("clearAreasButton")
            .addEventListener(
                "click",
                async () => {

                    await this.reloadOnlineAreas();

                }
            );

    },


    /*
    =========================================
    启动 GPS
    =========================================
    */

    startGps() {

        this.showSystemMessage(
            "正在获取GPS位置..."
        );


        GPSManager.start(

            gpsState => {

                this.handleGps(
                    gpsState
                );

            },

            errorMessage => {

                document
                    .getElementById("gpsState")
                    .textContent =
                    "● GPS异常";


                this.showSystemMessage(
                    errorMessage
                );

            }

        );

    },


    /*
    =========================================
    获取司机/车辆
    =========================================
    */

    getDriver() {

        return document
            .getElementById("driver")
            .value
            .trim();

    },


    getTruck() {

        return document
            .getElementById("truck")
            .value
            .trim();

    },


    /*
    =========================================
    每日自动清零
    =========================================
    */

    checkNewDay() {

        const newToday =
            StorageManager.getToday();


        if (
            newToday ===
            this.today
        ) {

            return;

        }


        this.today =
            StorageManager.initializeDay();

        this.transportState =
            StorageManager.getTransportState();

        this.tripCount =
            StorageManager.getTripCount();

        this.currentLoad =
            StorageManager.getCurrentLoad();


        document
            .getElementById("todayDate")
            .textContent =
            this.today;


        this.updateCount();

        this.updateTransportStatus();

        this.renderRecords();

        this.updateButtons();


        this.showSystemMessage(
            "已进入新的一天，今日运输统计已重新开始"
        );

    },


    /*
    =========================================
    GPS位置更新
    =========================================
    */

    handleGps(gps) {

        this.gps =
            gps;


        document
            .getElementById("gpsState")
            .textContent =
            "● GPS定位正常";


        document
            .getElementById("latitude")
            .textContent =
            gps.latitude.toFixed(6);


        document
            .getElementById("longitude")
            .textContent =
            gps.longitude.toFixed(6);


        document
            .getElementById("accuracy")
            .textContent =
            gps.accuracy.toFixed(1)
            +
            " 米";


        document
            .getElementById("gpsTime")
            .textContent =
            this.formatTime(
                new Date(
                    gps.timestamp
                )
            );


        this.updateArea(
            gps
        );

        this.updateButtons();


        this.updateWeather(
            gps.latitude,
            gps.longitude
        );

    },


    /*
    =========================================
    当前区域显示
    =========================================
    */

    updateArea(gps) {

        const areaName =
            document
                .getElementById("areaName");


        const areaDistance =
            document
                .getElementById("areaDistance");


        if (
            gps.area === "LOAD"
        ) {

            areaName.textContent =
                MineAreas.load.name;


            areaDistance.textContent =
                "距离装载区中心 "
                +
                gps.loadDistance.toFixed(1)
                +
                " 米";

        }


        else if (
            gps.area === "UNLOAD"
        ) {

            areaName.textContent =
                MineAreas.unload.name;


            areaDistance.textContent =
                "距离卸载区中心 "
                +
                gps.unloadDistance.toFixed(1)
                +
                " 米";

        }


        else {

            areaName.textContent =
                "运输途中";


            areaDistance.textContent =
                "距装载区 "
                +
                gps.loadDistance.toFixed(0)
                +
                " 米 ｜ 距卸载区 "
                +
                gps.unloadDistance.toFixed(0)
                +
                " 米";

        }

    },


    /*
    =========================================
    按钮控制
    =========================================
    */

    updateButtons() {

        const loadButton =
            document
                .getElementById("loadButton");


        const unloadButton =
            document
                .getElementById("unloadButton");


        const hint =
            document
                .getElementById("operationHint");


        if (!this.gps) {

            loadButton.disabled =
                true;

            unloadButton.disabled =
                true;

            hint.textContent =
                "等待GPS定位";

            return;

        }


        if (
            this.transportState ===
            "WAIT_LOAD"
        ) {

            unloadButton.disabled =
                true;


            if (
                this.gps.area ===
                "LOAD"
            ) {

                loadButton.disabled =
                    false;


                hint.textContent =
                    "已进入装载区，可以确认已装车";

            } else {

                loadButton.disabled =
                    true;


                hint.textContent =
                    "进入装载区后，“已装车”按钮自动启用";

            }

        } else {

            loadButton.disabled =
                true;


            if (
                this.gps.area ===
                "UNLOAD"
            ) {

                unloadButton.disabled =
                    false;


                hint.textContent =
                    "已进入卸载区，可以确认已卸车";

            } else {

                unloadButton.disabled =
                    true;


                hint.textContent =
                    "运输中，进入卸载区后可以确认卸车";

            }

        }

    },


    /*
    =========================================
    确认装车
    =========================================
    */

    confirmLoad() {

        const driver =
            this.getDriver();


        const truck =
            this.getTruck();


        if (
            driver === "" ||
            truck === ""
        ) {

            this.showSystemMessage(
                "请先填写司机姓名和车辆编号"
            );

            return;

        }


        if (
            !this.gps ||
            this.gps.area !==
            "LOAD"
        ) {

            this.showSystemMessage(
                "当前不在装载区域，不能确认装车"
            );

            return;

        }


        if (
            this.transportState !==
            "WAIT_LOAD"
        ) {

            return;

        }


        const now =
            new Date();


        this.currentLoad = {

            time:
                now.toISOString(),

            latitude:
                this.gps.latitude,

            longitude:
                this.gps.longitude,

            accuracy:
                this.gps.accuracy,

            area:
                MineAreas.load.name

        };


        StorageManager.setCurrentLoad(
            this.currentLoad
        );


        this.transportState =
            "WAIT_UNLOAD";


        StorageManager.setTransportState(
            this.transportState
        );


        this.updateTransportStatus();

        this.updateButtons();


        this.showSystemMessage(
            "装车确认成功："
            +
            this.formatTime(now)
            +
            "，请前往卸载区"
        );

    },


    /*
    =========================================
    确认卸车
    =========================================
    */

    confirmUnload() {

        if (
            !this.gps ||
            this.gps.area !==
            "UNLOAD"
        ) {

            this.showSystemMessage(
                "当前不在卸载区域，不能确认卸车"
            );

            return;

        }


        if (
            this.transportState !==
            "WAIT_UNLOAD"
        ) {

            this.showSystemMessage(
                "当前没有有效装车记录"
            );

            return;

        }


        if (!this.currentLoad) {

            this.showSystemMessage(
                "装车数据异常，本趟不能计数"
            );

            return;

        }


        const unloadDate =
            new Date();


        const loadDate =
            new Date(
                this.currentLoad.time
            );


        const durationSeconds =
            Math.max(
                0,
                Math.round(
                    (
                        unloadDate -
                        loadDate
                    )
                    /
                    1000
                )
            );


        this.tripCount++;


        const record = {

            id:
                Date.now(),

            date:
                this.today,

            tripNo:
                this.tripCount,

            driver:
                this.getDriver(),

            truck:
                this.getTruck(),

            loadArea:
                this.currentLoad.area,

            unloadArea:
                MineAreas.unload.name,

            loadTime:
                this.currentLoad.time,

            unloadTime:
                unloadDate.toISOString(),

            loadLatitude:
                this.currentLoad.latitude,

            loadLongitude:
                this.currentLoad.longitude,

            unloadLatitude:
                this.gps.latitude,

            unloadLongitude:
                this.gps.longitude,

            loadAccuracy:
                this.currentLoad.accuracy,

            unloadAccuracy:
                this.gps.accuracy,

            durationSeconds:
                durationSeconds

        };


        StorageManager.setTripCount(
            this.tripCount
        );


        StorageManager.addRecord(
            record
        );


        StorageManager.clearCurrentLoad();


        this.currentLoad =
            null;


        this.transportState =
            "WAIT_LOAD";


        StorageManager.setTransportState(
            this.transportState
        );


        this.updateCount();

        this.updateTransportStatus();

        this.updateButtons();

        this.renderRecords();

        this.showLatestTrip(
            record
        );


        this.showSystemMessage(
            "第 "
            +
            this.tripCount
            +
            " 趟完成，耗时 "
            +
            this.formatDuration(
                durationSeconds
            )
        );

    },


    /*
    =========================================
    异步设置在线装载区
    =========================================
    */

    async setCurrentAsLoadArea() {

        if (!this.gps) {

            this.showSystemMessage(
                "GPS尚未定位，不能设置装载区"
            );

            return;

        }


        if (!this.supabaseReady) {

            this.showSystemMessage(
                "Supabase尚未连接，不能保存在线装载区"
            );

            return;

        }


        if (
            this.gps.accuracy >
            50
        ) {

            const confirmed =
                confirm(
                    "当前GPS定位精度为 "
                    +
                    this.gps.accuracy.toFixed(1)
                    +
                    " 米，误差较大。\n\n仍然保存装载区吗？"
                );


            if (!confirmed) {

                return;

            }

        }


        const radius =
            Number(
                document
                    .getElementById("loadRadius")
                    .value
            );


        if (
            !radius ||
            radius < 10 ||
            radius > 500
        ) {

            this.showSystemMessage(
                "装载区半径请输入10到500米"
            );

            return;

        }


        const button =
            document
                .getElementById(
                    "setLoadAreaButton"
                );


        const originalText =
            button.textContent;


        button.disabled =
            true;


        button.textContent =
            "正在保存装载区...";


        this.showSystemMessage(
            "正在保存装载区到Supabase..."
        );


        try {

            await AreaManager
                .saveLoadArea(

                    this.gps.latitude,

                    this.gps.longitude,

                    radius

                );


            /*
            再从服务器读取一次
            确保本机拿到数据库最终数据
            */

            await AreaManager.refresh();


            GPSManager.refreshAreas();


            this.gps =
                GPSManager.getState();


            this.renderSavedAreas();


            if (
                this.gps &&
                this.gps.latitude !== null
            ) {

                this.updateArea(
                    this.gps
                );

            }


            this.updateButtons();


            this.showSystemMessage(
                "装载区保存成功，已写入Supabase。其他司机刷新网页后即可使用。"
            );

        }


        catch (error) {

            console.error(
                "保存装载区失败：",
                error
            );


            this.showSystemMessage(
                "装载区保存失败，请检查网络、Publishable Key、数据库表和RLS权限"
            );

        }


        finally {

            button.disabled =
                false;


            button.textContent =
                originalText;

        }

    },


    /*
    =========================================
    异步设置在线卸载区
    =========================================
    */

    async setCurrentAsUnloadArea() {

        if (!this.gps) {

            this.showSystemMessage(
                "GPS尚未定位，不能设置卸载区"
            );

            return;

        }


        if (!this.supabaseReady) {

            this.showSystemMessage(
                "Supabase尚未连接，不能保存在线卸载区"
            );

            return;

        }


        if (
            this.gps.accuracy >
            50
        ) {

            const confirmed =
                confirm(
                    "当前GPS定位精度为 "
                    +
                    this.gps.accuracy.toFixed(1)
                    +
                    " 米，误差较大。\n\n仍然保存卸载区吗？"
                );


            if (!confirmed) {

                return;

            }

        }


        const radius =
            Number(
                document
                    .getElementById("unloadRadius")
                    .value
            );


        if (
            !radius ||
            radius < 10 ||
            radius > 500
        ) {

            this.showSystemMessage(
                "卸载区半径请输入10到500米"
            );

            return;

        }


        const button =
            document
                .getElementById(
                    "setUnloadAreaButton"
                );


        const originalText =
            button.textContent;


        button.disabled =
            true;


        button.textContent =
            "正在保存卸载区...";


        this.showSystemMessage(
            "正在保存卸载区到Supabase..."
        );


        try {

            await AreaManager
                .saveUnloadArea(

                    this.gps.latitude,

                    this.gps.longitude,

                    radius

                );


            await AreaManager.refresh();


            GPSManager.refreshAreas();


            this.gps =
                GPSManager.getState();


            this.renderSavedAreas();


            if (
                this.gps &&
                this.gps.latitude !== null
            ) {

                this.updateArea(
                    this.gps
                );

            }


            this.updateButtons();


            this.showSystemMessage(
                "卸载区保存成功，已写入Supabase。其他司机刷新网页后即可使用。"
            );

        }


        catch (error) {

            console.error(
                "保存卸载区失败：",
                error
            );


            this.showSystemMessage(
                "卸载区保存失败，请检查网络、Publishable Key、数据库表和RLS权限"
            );

        }


        finally {

            button.disabled =
                false;


            button.textContent =
                originalText;

        }

    },


    /*
    =========================================
    异步重新同步在线区域
    =========================================
    */

    async reloadOnlineAreas() {

        if (!this.supabaseReady) {

            this.showSystemMessage(
                "Supabase尚未连接"
            );

            return;

        }


        const button =
            document
                .getElementById(
                    "clearAreasButton"
                );


        const originalText =
            button.textContent;


        button.disabled =
            true;


        button.textContent =
            "正在同步...";


        this.showSystemMessage(
            "正在从Supabase读取最新电子围栏..."
        );


        try {

            await AreaManager.refresh();


            GPSManager.refreshAreas();


            this.gps =
                GPSManager.getState();


            this.renderSavedAreas();


            if (
                this.gps &&
                this.gps.latitude !== null
            ) {

                this.updateArea(
                    this.gps
                );

            }


            this.updateButtons();


            this.showSystemMessage(
                "在线电子围栏同步成功"
            );

        }


        catch (error) {

            console.error(
                "电子围栏同步失败：",
                error
            );


            this.showSystemMessage(
                "在线电子围栏同步失败，请检查网络或Supabase配置"
            );

        }


        finally {

            button.disabled =
                false;


            button.textContent =
                originalText;

        }

    },


    /*
    =========================================
    显示当前电子围栏
    =========================================
    */

    renderSavedAreas() {

        const load =
            AreaManager.getLoadArea();


        const unload =
            AreaManager.getUnloadArea();


        document
            .getElementById("loadRadius")
            .value =
            load.radius;


        document
            .getElementById("unloadRadius")
            .value =
            unload.radius;


        document
            .getElementById("savedLoadArea")
            .innerHTML =

            "装载区中心："
            +
            Number(
                load.latitude
            ).toFixed(6)
            +
            ", "
            +
            Number(
                load.longitude
            ).toFixed(6)
            +
            "<br>半径："
            +
            load.radius
            +
            " 米";


        document
            .getElementById("savedUnloadArea")
            .innerHTML =

            "卸载区中心："
            +
            Number(
                unload.latitude
            ).toFixed(6)
            +
            ", "
            +
            Number(
                unload.longitude
            ).toFixed(6)
            +
            "<br>半径："
            +
            unload.radius
            +
            " 米";

    },


    /*
    =========================================
    今日趟数
    =========================================
    */

    updateCount() {

        document
            .getElementById("tripCount")
            .textContent =
            this.tripCount;

    },


    /*
    =========================================
    当前运输状态
    =========================================
    */

    updateTransportStatus() {

        const status =
            document
                .getElementById(
                    "transportStatus"
                );


        const loadTimeStatus =
            document
                .getElementById(
                    "loadTimeStatus"
                );


        if (
            this.transportState ===
            "WAIT_LOAD"
        ) {

            status.textContent =
                "等待装车";


            loadTimeStatus.textContent =
                "进入装载区域后确认装车";

        } else {

            status.textContent =
                "已装车 · 运输中";


            if (this.currentLoad) {

                loadTimeStatus.textContent =
                    "装车时间："
                    +
                    this.formatDateTime(
                        this.currentLoad.time
                    );

            }

        }

    },


    /*
    =========================================
    今日运输记录
    =========================================
    */

    renderRecords() {

        const records =
            StorageManager.getRecords();


        const box =
            document
                .getElementById(
                    "tripRecords"
                );


        document
            .getElementById(
                "recordCount"
            )
            .textContent =
            records.length
            +
            "条";


        if (
            records.length ===
            0
        ) {

            box.innerHTML =
                '<div class="empty-record">'
                +
                '今日暂无运输记录'
                +
                '</div>';


            return;

        }


        let html =
            "";


        records.forEach(

            record => {

                html += `

                    <div class="trip-record">

                        <div class="trip-record-title">
                            第 ${record.tripNo} 趟
                        </div>

                        <div class="trip-record-info">

                            司机：
                            ${this.escapeHtml(record.driver)}

                            <br>

                            车辆：
                            ${this.escapeHtml(record.truck)}

                            <br>

                            装车：
                            ${this.formatDateTime(record.loadTime)}

                            <br>

                            卸车：
                            ${this.formatDateTime(record.unloadTime)}

                        </div>

                        <div class="trip-duration">

                            耗时：
                            ${this.formatDuration(record.durationSeconds)}

                        </div>

                    </div>
                `;

            }

        );


        box.innerHTML =
            html;

    },


    /*
    =========================================
    最新一趟
    =========================================
    */

    showLatestTrip(
        record
    ) {

        const card =
            document
                .getElementById(
                    "latestTripCard"
                );


        const box =
            document
                .getElementById(
                    "latestTrip"
                );


        card
            .classList
            .remove(
                "hidden"
            );


        box.innerHTML =
            "<b>第 "
            +
            record.tripNo
            +
            " 趟完成</b>"
            +
            "<br>"
            +
            "装车："
            +
            this.formatTime(
                new Date(
                    record.loadTime
                )
            )
            +
            "<br>"
            +
            "卸车："
            +
            this.formatTime(
                new Date(
                    record.unloadTime
                )
            )
            +
            "<br>"
            +
            "耗时："
            +
            this.formatDuration(
                record.durationSeconds
            );

    },


    /*
    =========================================
    天气
    =========================================
    */

    async updateWeather(
        latitude,
        longitude
    ) {

        try {

            const weather =
                await WeatherManager
                    .update(
                        latitude,
                        longitude
                    );


            if (!weather) {

                return;

            }


            document
                .getElementById(
                    "weatherStatus"
                )
                .classList
                .add(
                    "hidden"
                );


            document
                .getElementById(
                    "weatherContent"
                )
                .classList
                .remove(
                    "hidden"
                );


            document
                .getElementById(
                    "weatherText"
                )
                .textContent =
                weather.weatherText;


            document
                .getElementById(
                    "temperature"
                )
                .textContent =
                weather.temperature
                +
                "℃";


            document
                .getElementById(
                    "apparentTemperature"
                )
                .textContent =
                weather.apparentTemperature
                +
                "℃";


            document
                .getElementById(
                    "humidity"
                )
                .textContent =
                weather.humidity
                +
                "%";


            document
                .getElementById(
                    "windSpeed"
                )
                .textContent =
                weather.windSpeed
                +
                " km/h";


            document
                .getElementById(
                    "precipitation"
                )
                .textContent =
                weather.precipitation
                +
                " mm";


            document
                .getElementById(
                    "weatherUpdateTime"
                )
                .textContent =
                "天气更新时间："
                +
                weather.time;

        }


        catch (error) {

            console.error(
                "天气更新失败：",
                error
            );


            document
                .getElementById(
                    "weatherStatus"
                )
                .textContent =
                "天气获取失败，请检查网络";

        }

    },


    /*
    =========================================
    系统提示
    =========================================
    */

    showSystemMessage(
        message
    ) {

        document
            .getElementById(
                "systemMessage"
            )
            .textContent =
            message;

    },


    /*
    =========================================
    时间格式
    =========================================
    */

    formatTime(
        date
    ) {

        return (
            String(
                date.getHours()
            ).padStart(
                2,
                "0"
            )
            +
            ":"
            +
            String(
                date.getMinutes()
            ).padStart(
                2,
                "0"
            )
            +
            ":"
            +
            String(
                date.getSeconds()
            ).padStart(
                2,
                "0"
            )
        );

    },


    formatDateTime(
        value
    ) {

        return this.formatTime(
            new Date(
                value
            )
        );

    },


    /*
    =========================================
    耗时
    =========================================
    */

    formatDuration(
        seconds
    ) {

        if (
            seconds <
            60
        ) {

            return (
                seconds
                +
                " 秒"
            );

        }


        const minutes =
            Math.floor(
                seconds /
                60
            );


        const remainSeconds =
            seconds %
            60;


        if (
            minutes <
            60
        ) {

            return (
                minutes
                +
                " 分 "
                +
                remainSeconds
                +
                " 秒"
            );

        }


        const hours =
            Math.floor(
                minutes /
                60
            );


        const remainMinutes =
            minutes %
            60;


        return (
            hours
            +
            " 小时 "
            +
            remainMinutes
            +
            " 分钟"
        );

    },


    /*
    =========================================
    HTML安全处理
    =========================================
    */

    escapeHtml(
        text
    ) {

        const div =
            document
                .createElement(
                    "div"
                );


        div.textContent =
            text ||
            "";


        return div.innerHTML;

    }

};



/*
=========================================
启动系统
=========================================
*/

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        await App.init();

    }

);