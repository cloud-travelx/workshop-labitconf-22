export interface AppsTotalSchema {
  num_byte_slice: number
  num_uint: number
}

export interface Asset {
  amount: number
  asset_id: number
  creator: string
  is_frozen: boolean
}

export interface AccountInfo {
  address: string
  amount: number
  amount_without_pending_rewards: number
  apps_local_state: never[]
  apps_total_schema: AppsTotalSchema
  assets: Asset[]
  created_apps: never[]
  created_assets: never[]
  pending_rewards: number
  reward_base: number
  rewards: number
  round: number
  status: string
}
