import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { WarehouseBranch, warehouseWorkspaceService } from '../services/warehouseWorkspaceService';

interface WarehouseWorkspaceValue { branches: WarehouseBranch[]; activeBranch?: WarehouseBranch; role: string; loading: boolean; error: string; refresh: () => Promise<void>; selectBranch: (id:string)=>Promise<void>; createFirst: (name:string)=>Promise<void> }
const Context=createContext<WarehouseWorkspaceValue|undefined>(undefined);

export const WarehouseWorkspaceProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const [state,setState]=useState<{branches:WarehouseBranch[];activeBranchId:string|null;role:string}>({branches:[],activeBranchId:null,role:'staff'});
  const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  const refresh=useCallback(async()=>{
    setLoading(true);
    setError('');
    try {
      let next=await warehouseWorkspaceService.load();
      if(next.branches.length===1&&!next.activeBranchId&&next.role==='admin_company'){
        await warehouseWorkspaceService.select(next.branches[0].id);
        next=await warehouseWorkspaceService.load();
      }
      setState(next);
    }catch(e){setError(e instanceof Error?e.message:'Không thể tải danh sách kho');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  const selectBranch=useCallback(async(id:string)=>{setError('');await warehouseWorkspaceService.select(id);await refresh();},[refresh]);
  const createFirst=useCallback(async(name:string)=>{setError('');await warehouseWorkspaceService.createFirst(name);await refresh();},[refresh]);
  const value=useMemo(()=>({...state,activeBranch:state.branches.find(b=>b.id===state.activeBranchId),loading,error,refresh,selectBranch,createFirst}),[state,loading,error,refresh,selectBranch,createFirst]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
};
export const useWarehouseWorkspace=()=>{const value=useContext(Context);if(!value)throw new Error('WarehouseWorkspaceProvider is missing');return value;};
