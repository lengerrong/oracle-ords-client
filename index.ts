import axios from "axios"

const SODA_LATEST = "soda/latest"

export type JSONValue =
    | string
    | number
    | boolean
    | { [k: string]: JSONValue }
    | Array<JSONValue>

export interface Link {
    rel: string
    href: string
}

export type Item = {
    id: string
    etag: string
    lastModified: Date
    created: Date
    links?: Link[]
    value?: JSONValue
}

export type Collection = {
    items: Item[]
    hasMore: boolean
    count: number
}

export interface ORDSOAuthClientConfig {
    client_id: string
    client_secret: string
    schema: string // user name owns the oracle autonomous json database
    ords_url: string // oracl autonomous json database ords rest base url
}

interface ORDSOAuthClient {
    config: ORDSOAuthClientConfig
    putJSONDocument: (alias: string, json: JSONValue) => Promise<Item>
    deleteJSONObject: (alias: string, id: string) => Promise<boolean>
    queryJSONDocument: (alias: string, query: any, payload: any) =>Promise<Collection>
}

class OracleORDSClient implements ORDSOAuthClient {
    config: ORDSOAuthClientConfig
    private access_token: string
    private expires_at: Date
    constructor(config: ORDSOAuthClientConfig) {
        this.config = config
        this.access_token = ""
        this.expires_at = new Date()
    }

    async putJSONDocument(alias: string, json: JSONValue): Promise<Item> {
        await this.ensureOauthToken()
        const { access_token } = this
        const { schema, ords_url } = this.config
        const url = this.buildUrl(ords_url, schema, SODA_LATEST, alias)
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`
        }
        const { data } = await axios({
            url,
            method: 'post',
            headers,
            data: json
        })
        const { items } = data
        return items[0]
    }

    async deleteJSONObject(alias: string, id: string): Promise<boolean> {
        try {
            await this.ensureOauthToken()
            const { access_token } = this
            const { schema, ords_url } = this.config
            const url = this.buildUrl(ords_url, schema, SODA_LATEST, alias, id)
            const headers = {
                Authorization: `Bearer ${access_token}`
            }
            await axios({
                url,
                method: "delete",
                headers
            })
            return true
        } catch {
            return false
        }
    }

    async queryJSONDocument(alias: string, query: any, payload: any): Promise<Collection> {
        await this.ensureOauthToken()
        const { access_token } = this
        const { schema, ords_url } = this.config
        const url = this.buildUrl(ords_url, schema, SODA_LATEST, alias)
        const headers = {
            'content-type': 'application/json',
            Authorization: `Bearer ${access_token}`
        }
        const { data } = await axios({
            url,
            method: "post",
            headers,
            params: query,
            data: payload
        })
        return data
    }

    private buildUrl(...parts: string[]) {
        return parts.reduce((url, part) => {
            // remove leading / from part
            let newPart = part.startsWith("/") ? part.substring(1) : part
            if (url.endsWith("/")) {
                return url + newPart
            } else {
                return url + "/" + newPart
            }
        }, "")
    }

    private async ensureOauthToken() {
        if (!this.access_token || this.expires_at.getTime() > new Date().getTime()) {
            // oauth token expired or not obtained yet
            // obtain a new token
            const { schema, ords_url, client_id, client_secret } = this.config
            const url = this.buildUrl(ords_url, schema, "oauth/token")
            const auth_token = Buffer.from(
                `${client_id}:${client_secret}`,
                'utf-8'
            ).toString('base64')
            const body = new URLSearchParams()
            body.append('grant_type', 'client_credentials')
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth_token}`
            }
            return axios({
                method: "post",
                url,
                headers,
                data: body
            }).then(({ data }) => {
                const { access_token, expires_in } = data
                this.access_token = access_token
                this.expires_at = new Date((new Date().getTime() + expires_in * 1000))
            })
        }
    }
}

export default OracleORDSClient