import { apiClient } from '../lib/supabase';

export const warehouseTransferService = {
  async transfer(input:{sourceBranchId:string;destinationBranchId:string;productId:string;quantity:number;date:string;notes:string;transferId:string}):Promise<string>{
    const {data,error}=await apiClient.rpc('inventory_transfer_stock',{p_source_branch_id:input.sourceBranchId,p_destination_branch_id:input.destinationBranchId,p_product_id:input.productId,p_quantity:input.quantity,p_transfer_date:input.date,p_notes:input.notes||null,p_transfer_id:input.transferId});
    if(error)throw new Error(error.message);return data as string;
  },
  async list(){const {data,error}=await apiClient.from('inventory_transfers').select('*,product:products(name,business_code),source:branches!inventory_transfers_source_branch_id_fkey(name),destination:branches!inventory_transfers_destination_branch_id_fkey(name)').order('created_at',{ascending:false}).limit(50);if(error)throw new Error(error.message);return data||[];},
};
