/*
=========================================
矿山运输管理系统 V1.2
Supabase 在线数据库
=========================================
*/


/*
=========================================
这里填写你的 Supabase 项目信息
=========================================
*/


const SUPABASE_URL =
    "这里填写你的Project URL";


const SUPABASE_PUBLISHABLE_KEY =
    "这里填写你的Publishable key";


/*
例如：

const SUPABASE_URL =
    "https://abcdefgh.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_xxxxxxxxxxxxxxxxx";

*/


const SupabaseManager = {

    client: null,


    init() {

        if (
            !SUPABASE_URL ||
            !SUPABASE_PUBLISHABLE_KEY ||
            SUPABASE_URL.includes("这里填写") ||
            SUPABASE_PUBLISHABLE_KEY.includes("这里填写")
        ) {

            console.warn(
                "Supabase尚未配置"
            );

            return false;

        }


        this.client =
            window.supabase
                .createClient(

                    SUPABASE_URL,

                    SUPABASE_PUBLISHABLE_KEY

                );


        console.log(
            "Supabase连接已初始化"
        );


        return true;

    },


    /*
    =========================================
    读取全部区域
    =========================================
    */

    async getAreas() {

        if (!this.client) {

            throw new Error(
                "Supabase尚未初始化"
            );

        }


        const {
            data,
            error
        } =

            await this.client

                .from(
                    "mine_areas"
                )

                .select(
                    "id,name,latitude,longitude,radius,updated_at"
                );


        if (error) {

            throw error;

        }


        return data || [];

    },


    /*
    =========================================
    保存/更新装载区
    =========================================
    */

    async saveLoadArea(
        latitude,
        longitude,
        radius
    ) {

        return this.saveArea({

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

        });

    },


    /*
    =========================================
    保存/更新卸载区
    =========================================
    */

    async saveUnloadArea(
        latitude,
        longitude,
        radius
    ) {

        return this.saveArea({

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

        });

    },


    /*
    =========================================
    通用保存区域
    =========================================
    */

    async saveArea(area) {

        if (!this.client) {

            throw new Error(
                "Supabase尚未初始化"
            );

        }


        const {
            error
        } =

            await this.client

                .from(
                    "mine_areas"
                )

                .upsert({

                    id:
                        area.id,

                    name:
                        area.name,

                    latitude:
                        area.latitude,

                    longitude:
                        area.longitude,

                    radius:
                        area.radius,

                    updated_at:
                        new Date()
                            .toISOString()

                });


        if (error) {

            throw error;

        }


        return true;

    }

};