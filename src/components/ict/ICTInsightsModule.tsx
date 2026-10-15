import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import {
  FTTHRecord,
  FTTBRecord,
  FTTMRecord,
  AttachmentMetadata,
} from '../../types';
import {
  Cpu,
  Layers,
  Building,
  Radio,
  Plus,
  Search,
  Filter,
  Paperclip,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Compass,
  Download,
  Eye,
  Trash2,
  Edit2,
  CheckCircle2,
  CheckSquare,
  AlertCircle,
  Calculator,
  Printer,
  X,
  Upload,
} from 'lucide-react';

export const ICTInsightsModule: React.FC = () => {
  const {
    subTab,
    setSubTab,
    currentUser,
    openLetterheadModal,
    showToast,
    homeCurrency,
    canAccessFeature,
    triggerDataRefresh,
    dataRevision,
  } = useApp();

  const [activeIctType, setActiveIctType] = useState<'ftth' | 'fttb' | 'fttm'>(() => {
    if (subTab === 'fttb') return 'fttb';
    if (subTab === 'fttm') return 'fttm';
    return 'ftth';
  });

  // Data states
  const [ftthRecords, setFtthRecords] = useState<FTTHRecord[]>(() => storage.getFTTH());
  const [fttbRecords, setFttbRecords] = useState<FTTBRecord[]>(() => storage.getFTTB());
  const [fttmRecords, setFttmRecords] = useState<FTTMRecord[]>(() => storage.getFTTM());

  const [recordToDelete, setRecordToDelete] = useState<{ record: any; type: 'FTTH' | 'FTTB' | 'FTTM'; name: string } | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<string>('');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  // Attachment Gallery Modal
  const [activeAttachmentRecord, setActiveAttachmentRecord] = useState<any | null>(null);
  const [previewingAttachment, setPreviewingAttachment] = useState<AttachmentMetadata | null>(null);

  // Sync with global subTab
  React.useEffect(() => {
    if (subTab === 'ftth') setActiveIctType('ftth');
    if (subTab === 'fttb') setActiveIctType('fttb');
    if (subTab === 'fttm') setActiveIctType('fttm');
  }, [subTab]);

  // Sync with global dataRevision
  React.useEffect(() => {
    setFtthRecords(storage.getFTTH());
    setFttbRecords(storage.getFTTB());
    setFttmRecords(storage.getFTTM());
  }, [dataRevision]);

  const switchTab = (tab: 'ftth' | 'fttb' | 'fttm') => {
    setActiveIctType(tab);
    setSubTab(tab);
  };

  const reloadData = () => {
    setFtthRecords(storage.getFTTH());
    setFttbRecords(storage.getFTTB());
    setFttmRecords(storage.getFTTM());
    triggerDataRefresh();
  };

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtered & Sorted FTTH
  const filteredFtth = useMemo(() => {
    let list = ftthRecords.filter((r) => {
      const matchSearch =
        r.clusterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.clientOperator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.supervisor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || r.testingStatus === statusFilter;
      return matchSearch && matchStatus;
    });

    if (sortField) {
      list = [...list].sort((a: any, b: any) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number') return sortAsc ? valA - valB : valB - valA;
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }
    return list;
  }, [ftthRecords, searchQuery, statusFilter, sortField, sortAsc]);

  // Filtered & Sorted FTTB
  const filteredFttb = useMemo(() => {
    let list = fttbRecords.filter((r) => {
      const matchSearch =
        r.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.buildingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.supervisor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (sortField) {
      list = [...list].sort((a: any, b: any) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number') return sortAsc ? valA - valB : valB - valA;
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }
    return list;
  }, [fttbRecords, searchQuery, statusFilter, sortField, sortAsc]);

  // Filtered & Sorted FTTM
  const filteredFttm = useMemo(() => {
    let list = fttmRecords.filter((r) => {
      const matchSearch =
        r.siteId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.towerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.metroSector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.btsNodeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.leadEngineer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (sortField) {
      list = [...list].sort((a: any, b: any) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number') return sortAsc ? valA - valB : valB - valA;
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }
    return list;
  }, [fttmRecords, searchQuery, statusFilter, sortField, sortAsc]);

  // Save Record (FTTH / FTTB / FTTM)
  const handleSaveRecord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (activeIctType === 'ftth') {
      const recordData: FTTHRecord = {
        id: editingRecord ? editingRecord.id : `ftth_${Date.now()}`,
        clusterId: ((fd.get('clusterId') as string) || '').trim() || (editingRecord?.clusterId || `FTTH-${Date.now().toString().slice(-4)}`),
        zone: ((fd.get('zone') as string) || '').trim() || (editingRecord?.zone || 'Zone 1'),
        clientOperator: ((fd.get('clientOperator') as string) || '').trim() || (editingRecord?.clientOperator || 'PTCL / Nayatel'),
        homesPassed: fd.get('homesPassed') !== null && fd.get('homesPassed') !== '' ? Number(fd.get('homesPassed')) : (editingRecord?.homesPassed ?? 256),
        fatsInstalled: fd.get('fatsInstalled') !== null && fd.get('fatsInstalled') !== '' ? Number(fd.get('fatsInstalled')) : (editingRecord?.fatsInstalled ?? 16),
        splitterRatio: (fd.get('splitterRatio') as any) || (editingRecord?.splitterRatio || '1:16'),
        dropCableMeters: fd.get('dropCableMeters') !== null && fd.get('dropCableMeters') !== '' ? Number(fd.get('dropCableMeters')) : (editingRecord?.dropCableMeters ?? 3200),
        opticalPowerDbm: fd.get('opticalPowerDbm') !== null && fd.get('opticalPowerDbm') !== '' ? Number(fd.get('opticalPowerDbm')) : (editingRecord?.opticalPowerDbm ?? -19.0),
        testingStatus: (fd.get('testingStatus') as any) || (editingRecord?.testingStatus || 'Passed'),
        implementationDate: (fd.get('implementationDate') as string) || (editingRecord?.implementationDate || new Date().toISOString().split('T')[0]),
        supervisor: ((fd.get('supervisor') as string) || '').trim() || (editingRecord?.supervisor || currentUser?.fullName || 'Lead'),
        costEstimate: fd.get('costEstimate') !== null && fd.get('costEstimate') !== '' ? Number(fd.get('costEstimate')) : (editingRecord?.costEstimate ?? 0),
        currency: homeCurrency,
        isWorkDone: fd.get('isWorkDone') !== null ? (fd.get('isWorkDone') === 'on' || fd.get('isWorkDone') === 'true') : (editingRecord?.isWorkDone ?? false),
        attachments: editingRecord?.attachments || [],
        notes: ((fd.get('notes') as string) || '').trim(),
        createdByUserId: editingRecord ? (editingRecord.createdByUserId || currentUser?.id) : currentUser?.id,
        createdByUserName: editingRecord ? (editingRecord.createdByUserName || currentUser?.fullName) : currentUser?.fullName,
        lastUpdatedByUserId: currentUser?.id,
        lastUpdatedByUserName: currentUser?.fullName,
      };

      const current = storage.getFTTH();
      const updated = editingRecord
        ? current.map((r) => (r.id === editingRecord.id ? recordData : r))
        : [recordData, ...current];

      storage.saveFTTH(updated);
      setFtthRecords(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: editingRecord ? 'UPDATE' : 'CREATE',
        module: 'ICT_Work',
        targetId: recordData.id,
        description: `${editingRecord ? 'Updated' : 'Created'} FTTH cluster record ${recordData.clusterId}`,
      });
      showToast(`FTTH Cluster ${recordData.clusterId} saved.`, 'success');
    } else if (activeIctType === 'fttb') {
      const recordData: FTTBRecord = {
        id: editingRecord ? editingRecord.id : `fttb_${Date.now()}`,
        buildingName: ((fd.get('buildingName') as string) || '').trim() || (editingRecord?.buildingName || 'Building Alpha'),
        buildingId: ((fd.get('buildingId') as string) || '').trim() || (editingRecord?.buildingId || `BLD-${Date.now().toString().slice(-4)}`),
        risersCount: fd.get('risersCount') !== null && fd.get('risersCount') !== '' ? Number(fd.get('risersCount')) : (editingRecord?.risersCount ?? 1),
        floorsCount: fd.get('floorsCount') !== null && fd.get('floorsCount') !== '' ? Number(fd.get('floorsCount')) : (editingRecord?.floorsCount ?? 1),
        mduBoxType: ((fd.get('mduBoxType') as string) || '').trim() || (editingRecord?.mduBoxType || 'Wall-Mount MDU 32-Port'),
        distributionFibers: fd.get('distributionFibers') !== null && fd.get('distributionFibers') !== '' ? Number(fd.get('distributionFibers')) : (editingRecord?.distributionFibers ?? 24),
        opticalPowerDbm: fd.get('opticalPowerDbm') !== null && fd.get('opticalPowerDbm') !== '' ? Number(fd.get('opticalPowerDbm')) : (editingRecord?.opticalPowerDbm ?? -18.0),
        activeCustomerPorts: fd.get('activeCustomerPorts') !== null && fd.get('activeCustomerPorts') !== '' ? Number(fd.get('activeCustomerPorts')) : (editingRecord?.activeCustomerPorts ?? 0),
        status: (fd.get('status') as any) || (editingRecord?.status || 'Commissioned'),
        handoverDate: (fd.get('handoverDate') as string) || (editingRecord?.handoverDate || new Date().toISOString().split('T')[0]),
        supervisor: ((fd.get('supervisor') as string) || '').trim() || (editingRecord?.supervisor || currentUser?.fullName || 'Lead'),
        costEstimate: fd.get('costEstimate') !== null && fd.get('costEstimate') !== '' ? Number(fd.get('costEstimate')) : (editingRecord?.costEstimate ?? 0),
        currency: homeCurrency,
        isWorkDone: fd.get('isWorkDone') !== null ? (fd.get('isWorkDone') === 'on' || fd.get('isWorkDone') === 'true') : (editingRecord?.isWorkDone ?? false),
        attachments: editingRecord?.attachments || [],
        notes: ((fd.get('notes') as string) || '').trim(),
        createdByUserId: editingRecord ? (editingRecord.createdByUserId || currentUser?.id) : currentUser?.id,
        createdByUserName: editingRecord ? (editingRecord.createdByUserName || currentUser?.fullName) : currentUser?.fullName,
        lastUpdatedByUserId: currentUser?.id,
        lastUpdatedByUserName: currentUser?.fullName,
      };

      const current = storage.getFTTB();
      const updated = editingRecord
        ? current.map((r) => (r.id === editingRecord.id ? recordData : r))
        : [recordData, ...current];

      storage.saveFTTB(updated);
      setFttbRecords(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: editingRecord ? 'UPDATE' : 'CREATE',
        module: 'ICT_Work',
        targetId: recordData.id,
        description: `${editingRecord ? 'Updated' : 'Created'} FTTB building record ${recordData.buildingName}`,
      });
      showToast(`FTTB Building ${recordData.buildingName} saved.`, 'success');
    } else {
      // FTTM
      const recordData: FTTMRecord = {
        id: editingRecord ? editingRecord.id : `fttm_${Date.now()}`,
        siteId: ((fd.get('siteId') as string) || '').trim() || (editingRecord?.siteId || `BTS-${Date.now().toString().slice(-3)}-5G`),
        towerName: ((fd.get('towerName') as string) || '').trim() || (editingRecord?.towerName || 'Tower Alpha'),
        metroSector: ((fd.get('metroSector') as string) || '').trim() || (editingRecord?.metroSector || 'Urban Sector 1'),
        backhaulBandwidth: ((fd.get('backhaulBandwidth') as string) || '').trim() || (editingRecord?.backhaulBandwidth || '10 Gbps Metro Ring'),
        btsNodeId: ((fd.get('btsNodeId') as string) || '').trim() || (editingRecord?.btsNodeId || 'BTS-NODE-001'),
        sfpTransceivers: ((fd.get('sfpTransceivers') as string) || '').trim() || (editingRecord?.sfpTransceivers || '10G BiDi SFP+ 40km'),
        otdrDistanceKm: fd.get('otdrDistanceKm') !== null && fd.get('otdrDistanceKm') !== '' ? Number(fd.get('otdrDistanceKm')) : (editingRecord?.otdrDistanceKm ?? 10.5),
        attenuationDb: fd.get('attenuationDb') !== null && fd.get('attenuationDb') !== '' ? Number(fd.get('attenuationDb')) : (editingRecord?.attenuationDb ?? 3.2),
        status: (fd.get('status') as any) || (editingRecord?.status || 'Live on Air'),
        activationDate: (fd.get('activationDate') as string) || (editingRecord?.activationDate || new Date().toISOString().split('T')[0]),
        leadEngineer: ((fd.get('leadEngineer') as string) || '').trim() || (editingRecord?.leadEngineer || currentUser?.fullName || 'Lead'),
        costEstimate: fd.get('costEstimate') !== null && fd.get('costEstimate') !== '' ? Number(fd.get('costEstimate')) : (editingRecord?.costEstimate ?? 0),
        currency: homeCurrency,
        attachments: editingRecord?.attachments || [],
        notes: ((fd.get('notes') as string) || '').trim(),
        createdByUserId: editingRecord ? (editingRecord.createdByUserId || currentUser?.id) : currentUser?.id,
        createdByUserName: editingRecord ? (editingRecord.createdByUserName || currentUser?.fullName) : currentUser?.fullName,
        lastUpdatedByUserId: currentUser?.id,
        lastUpdatedByUserName: currentUser?.fullName,
      };

      const current = storage.getFTTM();
      const updated = editingRecord
        ? current.map((r) => (r.id === editingRecord.id ? recordData : r))
        : [recordData, ...current];

      storage.saveFTTM(updated);
      setFttmRecords(updated);
      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: editingRecord ? 'UPDATE' : 'CREATE',
        module: 'ICT_Work',
        targetId: recordData.id,
        description: `${editingRecord ? 'Updated' : 'Created'} FTTM cellular tower record ${recordData.siteId}`,
      });
      showToast(`FTTM Cell Site ${recordData.siteId} saved.`, 'success');
    }

    setIsRecordModalOpen(false);
    setEditingRecord(null);
    reloadData();
  };

  // Toggle Work Done checkbox for FTTH / FTTB
  const handleToggleWorkDone = (type: 'ftth' | 'fttb', id: string) => {
    if (type === 'ftth') {
      const current = storage.getFTTH();
      const updated = current.map((r) =>
        r.id === id ? { ...r, isWorkDone: !r.isWorkDone } : r
      );
      storage.saveFTTH(updated);
      setFtthRecords(updated);
      const target = updated.find((r) => r.id === id);
      showToast(
        `FTTH Cluster ${target?.clusterId || ''} marked as ${target?.isWorkDone ? 'Work Done ✓' : 'Pending Work'}.`,
        'success'
      );
    } else {
      const current = storage.getFTTB();
      const updated = current.map((r) =>
        r.id === id ? { ...r, isWorkDone: !r.isWorkDone } : r
      );
      storage.saveFTTB(updated);
      setFttbRecords(updated);
      const target = updated.find((r) => r.id === id);
      showToast(
        `FTTB Building ${target?.buildingName || ''} marked as ${target?.isWorkDone ? 'Work Done ✓' : 'Pending Work'}.`,
        'success'
      );
    }
    reloadData();
  };

  // Delete Record via Modal Confirmation
  const handleDeleteRecord = (rec: any) => {
    let name = '';
    if (activeIctType === 'ftth') {
      name = `${rec.clusterId || rec.id} (${rec.zone || 'Zone'})`;
    } else if (activeIctType === 'fttb') {
      name = `${rec.buildingName || rec.buildingId || rec.id} (${rec.buildingId || 'Building'})`;
    } else {
      name = `${rec.siteId || rec.id} - ${rec.towerName || 'Tower'} (${rec.metroSector || 'Sector'})`;
    }
    setRecordToDelete({
      record: rec,
      type: activeIctType.toUpperCase() as 'FTTH' | 'FTTB' | 'FTTM',
      name,
    });
  };

  const handleConfirmDeleteRecord = () => {
    if (!recordToDelete) return;
    setIsDeletingRecord(true);
    try {
      const rec = recordToDelete.record;
      const recType = recordToDelete.type;

      if (recType === 'FTTH') {
        const current = storage.getFTTH();
        const updated = current.filter((r) => r.id !== rec.id);
        storage.saveFTTH(updated);
        setFtthRecords(updated);
      } else if (recType === 'FTTB') {
        const current = storage.getFTTB();
        const updated = current.filter((r) => r.id !== rec.id);
        storage.saveFTTB(updated);
        setFttbRecords(updated);
      } else {
        const current = storage.getFTTM();
        const updated = current.filter((r) => r.id !== rec.id);
        storage.saveFTTM(updated);
        setFttmRecords(updated);
      }

      storage.logActivity({
        userId: currentUser?.id || 'sys',
        userName: currentUser?.fullName || 'User',
        userRole: currentUser?.role || 'Standard User',
        action: 'DELETE',
        module: 'ICT_Work',
        targetId: rec.id,
        description: `Permanently deleted ${recType} deployment record ${recordToDelete.name}`,
      });

      showToast(`${recType} record "${recordToDelete.name}" permanently deleted.`, 'warning');
      setRecordToDelete(null);
      reloadData();
    } catch (err: any) {
      showToast(`Failed to delete record: ${err?.message || err}`, 'error');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  // Add mock / real file attachment
  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeAttachmentRecord) return;
    const file = e.target.files[0];

    let type: AttachmentMetadata['fileType'] = 'other';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'dwg' || ext === 'dxf') type = 'cad_dwg';
    else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') type = 'xlsx';
    else if (ext === 'pdf') type = 'pdf';
    else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) type = 'image';

    const newAtt: AttachmentMetadata = {
      id: `att_${Date.now()}`,
      name: file.name,
      fileType: type,
      sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser?.fullName || 'Engineer',
      notes: `Uploaded attachment for ${activeAttachmentRecord.clusterId || activeAttachmentRecord.buildingName || activeAttachmentRecord.siteId}`,
    };

    // If image, create local object URL for preview
    if (type === 'image') {
      newAtt.previewUrl = URL.createObjectURL(file);
    }

    const updatedRecord = {
      ...activeAttachmentRecord,
      attachments: [...(activeAttachmentRecord.attachments || []), newAtt],
    };

    // Save in storage
    if (activeIctType === 'ftth') {
      storage.saveFTTH(ftthRecords.map((r) => (r.id === activeAttachmentRecord.id ? updatedRecord : r)));
    } else if (activeIctType === 'fttb') {
      storage.saveFTTB(fttbRecords.map((r) => (r.id === activeAttachmentRecord.id ? updatedRecord : r)));
    } else {
      storage.saveFTTM(fttmRecords.map((r) => (r.id === activeAttachmentRecord.id ? updatedRecord : r)));
    }

    setActiveAttachmentRecord(updatedRecord);
    reloadData();
    showToast(`Attached ${file.name} successfully.`, 'success');
  };

  // Delete attachment
  const handleDeleteAttachment = (attId: string) => {
    if (!activeAttachmentRecord) return;
    const updatedRecord = {
      ...activeAttachmentRecord,
      attachments: activeAttachmentRecord.attachments.filter((a: AttachmentMetadata) => a.id !== attId),
    };

    if (activeIctType === 'ftth') {
      storage.saveFTTH(ftthRecords.map((r) => (r.id === activeAttachmentRecord.id ? updatedRecord : r)));
    } else if (activeIctType === 'fttb') {
      storage.saveFTTB(fttbRecords.map((r) => (r.id === activeAttachmentRecord.id ? updatedRecord : r)));
    } else {
      storage.saveFTTM(fttmRecords.map((r) => (r.id === activeAttachmentRecord.id ? updatedRecord : r)));
    }

    setActiveAttachmentRecord(updatedRecord);
    reloadData();
    showToast('Attachment removed.', 'info');
  };

  // Export Letterhead
  const handleExportLetterhead = () => {
    if (activeIctType === 'ftth') {
      const columns = [
        { header: 'Cluster ID', key: 'clusterId' },
        { header: 'Zone / Sector', key: 'zone' },
        { header: 'Client Operator', key: 'clientOperator' },
        { header: 'Homes Passed', key: 'homesPassed' },
        { header: 'FAT Boxes', key: 'fatsInstalled' },
        { header: 'Splitter', key: 'splitterRatio' },
        { header: 'Drop Cable (m)', key: 'dropCableMeters' },
        { header: 'Optical Power (dBm)', key: 'opticalPowerDbm' },
        { header: 'Testing Status', key: 'testingStatus' },
        { header: 'Supervisor', key: 'supervisor' },
      ];
      openLetterheadModal({
        title: 'ICT D&I: FTTH (Fiber to the Home) Deployment Register',
        columns,
        data: filteredFtth,
        dateRange: `As of ${new Date().toLocaleDateString()}`,
        filterSummary: `Status: ${statusFilter}, Records: ${filteredFtth.length}`,
      });
    } else if (activeIctType === 'fttb') {
      const columns = [
        { header: 'Building Name', key: 'buildingName' },
        { header: 'Building ID', key: 'buildingId' },
        { header: 'Risers', key: 'risersCount' },
        { header: 'Floors', key: 'floorsCount' },
        { header: 'MDU Box Type', key: 'mduBoxType' },
        { header: 'Dist. Fibers', key: 'distributionFibers' },
        { header: 'Active Ports', key: 'activeCustomerPorts' },
        { header: 'Status', key: 'status' },
        { header: 'Handover Date', key: 'handoverDate' },
        { header: 'Supervisor', key: 'supervisor' },
      ];
      openLetterheadModal({
        title: 'ICT D&I: FTTB (Fiber to the Building) Commissioning Ledger',
        columns,
        data: filteredFttb,
        dateRange: `As of ${new Date().toLocaleDateString()}`,
        filterSummary: `Status: ${statusFilter}, Records: ${filteredFttb.length}`,
      });
    } else {
      const columns = [
        { header: 'Cell Site ID', key: 'siteId' },
        { header: 'Tower Monopole Name', key: 'towerName' },
        { header: 'Metro Sector', key: 'metroSector' },
        { header: 'Backhaul Bandwidth', key: 'backhaulBandwidth' },
        { header: 'BTS Node ID', key: 'btsNodeId' },
        { header: 'SFP Transceivers', key: 'sfpTransceivers' },
        { header: 'OTDR Dist (km)', key: 'otdrDistanceKm' },
        { header: 'Link Loss (dB)', key: 'attenuationDb' },
        { header: 'Loss Rate (dB/km)', key: 'lossRate' },
        { header: 'Status', key: 'status' },
        { header: 'Lead Engineer', key: 'leadEngineer' },
      ];
      const dataWithFormula = filteredFttm.map((r) => ({
        ...r,
        lossRate: r.otdrDistanceKm > 0 ? (r.attenuationDb / r.otdrDistanceKm).toFixed(3) : '0.000',
      }));
      openLetterheadModal({
        title: 'ICT D&I: FTTM (Fiber to Mobile / Metro Tower Backhaul) Register',
        columns,
        data: dataWithFormula,
        dateRange: `As of ${new Date().toLocaleDateString()}`,
        filterSummary: `Status: ${statusFilter}, Records: ${filteredFttm.length}`,
      });
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]">
              ICT Activity Insights & D&I Engineering
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Module 2
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Structured Excel-style data entry grids for FTTH, FTTB, and FTTM (Mobile/Metro backhaul) with CAD/drawing attachments
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Main 3 ICT Segment Tabs */}
          <div className="flex rounded-lg bg-[var(--bg-card)] p-1 border border-[var(--border-main)] text-xs font-bold">
            <button
              onClick={() => switchTab('ftth')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeIctType === 'ftth'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>FTTH (Home)</span>
            </button>
            <button
              onClick={() => switchTab('fttb')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeIctType === 'fttb'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>FTTB (Building)</span>
            </button>
            <button
              onClick={() => switchTab('fttm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                activeIctType === 'fttm'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>FTTM (Mobile / Metro)</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingRecord(null);
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>

          <button
            onClick={handleExportLetterhead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-semibold text-[var(--text-main)] transition"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Letterhead</span>
          </button>
        </div>
      </div>

      {/* KPI & Formula Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {activeIctType === 'ftth' && (
          <>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Total Homes Passed</div>
              <div className="text-xl font-extrabold text-[var(--text-main)] mt-1">
                {ftthRecords.reduce((acc, r) => acc + r.homesPassed, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-blue-400 font-medium mt-0.5">
                Across {ftthRecords.length} deployment clusters
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Active FAT Access Terminals</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {ftthRecords.reduce((acc, r) => acc + r.fatsInstalled, 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Outdoor pole/wall enclosures</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Formula: Avg Drop Per Home</div>
              <div className="text-xl font-extrabold text-indigo-400 mt-1">
                {(
                  ftthRecords.reduce((acc, r) => acc + r.dropCableMeters, 0) /
                  (ftthRecords.reduce((acc, r) => acc + r.homesPassed, 0) || 1)
                ).toFixed(1)}{' '}
                <span className="text-xs font-normal">m / home</span>
              </div>
              <div className="text-[10px] text-indigo-400 font-medium mt-0.5">Standard threshold &le; 25m</div>
            </div>
          </>
        )}

        {activeIctType === 'fttb' && (
          <>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Commissioned Commercial Towers</div>
              <div className="text-xl font-extrabold text-[var(--text-main)] mt-1">{fttbRecords.length}</div>
              <div className="text-[10px] text-blue-400 font-medium mt-0.5">High-rise MDU installations</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Active Tenant Ports</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {fttbRecords.reduce((acc, r) => acc + r.activeCustomerPorts, 0)}
              </div>
              <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Gigabit optical terminations</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Vertical Risers Configured</div>
              <div className="text-xl font-extrabold text-purple-400 mt-1">
                {fttbRecords.reduce((acc, r) => acc + r.risersCount, 0)}
              </div>
              <div className="text-[10px] text-purple-400 font-medium mt-0.5">Fire-rated cable risers</div>
            </div>
          </>
        )}

        {activeIctType === 'fttm' && (
          <>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Cellular Tower Backhauls</div>
              <div className="text-xl font-extrabold text-[var(--text-main)] mt-1">{fttmRecords.length} Sites</div>
              <div className="text-[10px] text-blue-400 font-medium mt-0.5">Metro 5G/4G Macro Nodes</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Total OTDR Route Distance</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">
                {fttmRecords.reduce((acc, r) => acc + r.otdrDistanceKm, 0).toFixed(1)} km
              </div>
              <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Bidirectional trace verified</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)]">
              <div className="text-[11px] font-medium text-[var(--text-dim)]">Formula: Avg Link Loss Rate</div>
              <div className="text-xl font-extrabold text-amber-400 mt-1">
                {(
                  fttmRecords.reduce((acc, r) => acc + r.attenuationDb, 0) /
                  (fttmRecords.reduce((acc, r) => acc + r.otdrDistanceKm, 0) || 1)
                ).toFixed(3)}{' '}
                <span className="text-xs font-normal">dB/km</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Within ITU-T standard (&le; 0.35 dB/km)</div>
            </div>
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cluster, building, tower site, engineer..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
          >
            <option value="ALL">All Operational Statuses</option>
            {activeIctType === 'ftth' && (
              <>
                <option value="Passed">Passed</option>
                <option value="Pending">Pending</option>
                <option value="Attenuation Fault">Attenuation Fault</option>
              </>
            )}
            {activeIctType === 'fttb' && (
              <>
                <option value="Commissioned">Commissioned</option>
                <option value="Spliced">Spliced</option>
                <option value="Cable Pulled">Cable Pulled</option>
                <option value="Surveyed">Surveyed</option>
              </>
            )}
            {activeIctType === 'fttm' && (
              <>
                <option value="Live on Air">Live on Air</option>
                <option value="Spliced & Tested">Spliced & Tested</option>
                <option value="Fiber Blown">Fiber Blown</option>
                <option value="Civil Works">Civil Works</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Excel-Style Interactive Data Entry Grid */}
      <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-card)] shadow-xs">
        <div className="overflow-x-auto">
          {activeIctType === 'ftth' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold select-none">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-3 text-center w-28">Work Done</th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('clusterId')}>
                    Cluster ID {sortField === 'clusterId' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('zone')}>
                    Sector / Zone
                  </th>
                  <th className="py-3 px-4">Client Operator</th>
                  <th className="py-3 px-4 text-right cursor-pointer" onClick={() => handleSort('homesPassed')}>
                    Homes Passed
                  </th>
                  <th className="py-3 px-4 text-right">FAT Boxes</th>
                  <th className="py-3 px-4 text-center">Splitter</th>
                  <th className="py-3 px-4 text-right">Drop Cable</th>
                  <th className="py-3 px-4 text-right">Optical Power</th>
                  <th className="py-3 px-4 text-center">Testing Status</th>
                  <th className="py-3 px-4 text-center">CAD / Files</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]/60 font-mono text-[11px]">
                {filteredFtth.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-hover)] transition group">
                    <td className="py-3 px-3 text-center text-[var(--text-dim)] font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleWorkDone('ftth', r.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                          r.isWorkDone
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xs'
                            : 'bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-dim)] border-[var(--border-main)]'
                        }`}
                        title={r.isWorkDone ? 'Work Done (Click to uncheck)' : 'Click to mark Work Done'}
                      >
                        <CheckSquare className={`w-3.5 h-3.5 ${r.isWorkDone ? 'text-emerald-400' : 'text-[var(--text-dim)]'}`} />
                        <span>{r.isWorkDone ? 'Done ✓' : 'Pending'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-400">{r.clusterId}</td>
                    <td className="py-3 px-4 font-sans text-[var(--text-main)] font-medium">{r.zone}</td>
                    <td className="py-3 px-4 font-sans text-[var(--text-muted)]">{r.clientOperator}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-main)] font-bold">
                      {r.homesPassed.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400">{r.fatsInstalled}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--bg-input)] border border-[var(--border-light)] text-[var(--text-dim)]">
                        {r.splitterRatio}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--text-muted)]">
                      {r.dropCableMeters.toLocaleString()} m
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-400">
                      {r.opticalPowerDbm} dBm
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.testingStatus === 'Passed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {r.testingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setActiveAttachmentRecord(r)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] text-[11px] font-sans font-medium transition"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                        <span>{r.attachments?.length || 0} Files</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setIsRecordModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)]"
                          title="Edit Row"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(r)}
                          className="p-1 rounded hover:bg-rose-950/40 text-[var(--text-dim)] hover:text-rose-400 cursor-pointer transition"
                          title="Delete FTTH Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeIctType === 'fttb' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold select-none">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-3 text-center w-28">Work Done</th>
                  <th className="py-3 px-4">Building Name</th>
                  <th className="py-3 px-4">Building Code</th>
                  <th className="py-3 px-4 text-right">Risers</th>
                  <th className="py-3 px-4 text-right">Floors</th>
                  <th className="py-3 px-4">MDU Termination Box</th>
                  <th className="py-3 px-4 text-right">Dist. Fibers</th>
                  <th className="py-3 px-4 text-right">Active Ports</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">CAD / Files</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]/60 font-mono text-[11px]">
                {filteredFttb.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="py-3 px-3 text-center text-[var(--text-dim)] font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleWorkDone('fttb', r.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                          r.isWorkDone
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xs'
                            : 'bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-dim)] border-[var(--border-main)]'
                        }`}
                        title={r.isWorkDone ? 'Work Done (Click to uncheck)' : 'Click to mark Work Done'}
                      >
                        <CheckSquare className={`w-3.5 h-3.5 ${r.isWorkDone ? 'text-emerald-400' : 'text-[var(--text-dim)]'}`} />
                        <span>{r.isWorkDone ? 'Done ✓' : 'Pending'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-[var(--text-main)]">{r.buildingName}</td>
                    <td className="py-3 px-4 text-blue-400">{r.buildingId}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-muted)]">{r.risersCount}</td>
                    <td className="py-3 px-4 text-right text-[var(--text-muted)]">{r.floorsCount}</td>
                    <td className="py-3 px-4 font-sans text-[var(--text-dim)]">{r.mduBoxType}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{r.distributionFibers}</td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--text-main)]">
                      {r.activeCustomerPorts}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={() => setActiveAttachmentRecord(r)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] text-[11px] font-medium"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                        <span>{r.attachments?.length || 0} Files</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setIsRecordModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(r)}
                          className="p-1 rounded hover:bg-rose-950/40 text-[var(--text-dim)] hover:text-rose-400 cursor-pointer transition"
                          title="Delete FTTB Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeIctType === 'fttm' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] font-semibold select-none">
                  <th className="py-3 px-4">Cell Site ID</th>
                  <th className="py-3 px-4">Tower Monopole Name</th>
                  <th className="py-3 px-4">Metro Ring Sector</th>
                  <th className="py-3 px-4">BTS Node ID</th>
                  <th className="py-3 px-4">SFP Optics</th>
                  <th className="py-3 px-4 text-right">OTDR (km)</th>
                  <th className="py-3 px-4 text-right">Total Loss (dB)</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-400">Formula (dB/km)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">CAD / Files</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]/60 font-mono text-[11px]">
                {filteredFttm.map((r) => {
                  const lossPerKm = r.otdrDistanceKm > 0 ? (r.attenuationDb / r.otdrDistanceKm).toFixed(3) : '0.000';
                  return (
                    <tr key={r.id} className="hover:bg-[var(--bg-hover)] transition">
                      <td className="py-3 px-4 font-bold text-blue-400">{r.siteId}</td>
                      <td className="py-3 px-4 font-sans font-medium text-[var(--text-main)]">{r.towerName}</td>
                      <td className="py-3 px-4 font-sans text-[var(--text-muted)]">{r.metroSector}</td>
                      <td className="py-3 px-4 text-[var(--text-dim)]">{r.btsNodeId}</td>
                      <td className="py-3 px-4 text-emerald-400 text-[10px]">{r.sfpTransceivers}</td>
                      <td className="py-3 px-4 text-right text-[var(--text-main)] font-bold">{r.otdrDistanceKm} km</td>
                      <td className="py-3 px-4 text-right text-rose-400 font-bold">{r.attenuationDb} dB</td>
                      <td className="py-3 px-4 text-right font-extrabold text-amber-400">
                        {lossPerKm} <span className="text-[9px] font-normal text-[var(--text-dim)]">dB/km</span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <button
                          onClick={() => setActiveAttachmentRecord(r)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-main)] text-[11px] font-medium"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                          <span>{r.attachments?.length || 0} Files</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRecord(r);
                              setIsRecordModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-main)]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r)}
                            className="p-1 rounded hover:bg-rose-950/40 text-[var(--text-dim)] hover:text-rose-400 cursor-pointer transition"
                            title="Delete FTTM Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Attachments Gallery & Metadata Modal */}
      {activeAttachmentRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    File Attachments & CAD Drawings
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Linked to{' '}
                    <span className="font-mono text-blue-400">
                      {activeAttachmentRecord.clusterId ||
                        activeAttachmentRecord.buildingName ||
                        activeAttachmentRecord.siteId}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveAttachmentRecord(null);
                  setPreviewingAttachment(null);
                }}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload action area */}
            <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-[var(--border-light)] bg-[var(--bg-card)]/50 text-center hover:border-[var(--accent)] transition">
              <Upload className="w-6 h-6 text-[var(--text-dim)] mx-auto mb-1.5" />
              <div className="text-xs font-semibold text-[var(--text-main)]">
                Upload CAD Drawing (.dwg/.dxf), Excel (.xlsx), PDF, or Field Photos
              </div>
              <p className="text-[10px] text-[var(--text-dim)] mt-0.5">
                Accepts AutoCAD DWG, MicroStation DXF, Excel spreadsheets, test reports, and site imagery
              </p>
              <label className="mt-3 inline-block px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold cursor-pointer transition shadow">
                <span>Select Files from Device</span>
                <input
                  type="file"
                  onChange={handleAddAttachment}
                  accept=".dwg,.dxf,.xlsx,.xls,.pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
              </label>
            </div>

            {/* Attachments List */}
            <div className="mt-5 space-y-2 max-h-64 overflow-y-auto">
              {(!activeAttachmentRecord.attachments ||
                activeAttachmentRecord.attachments.length === 0) ? (
                <div className="p-6 text-center text-xs text-[var(--text-dim)]">
                  No files attached to this ICT record yet.
                </div>
              ) : (
                activeAttachmentRecord.attachments.map((att: AttachmentMetadata) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-light)] transition text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-main)] shrink-0">
                        {att.fileType === 'cad_dwg' && <Compass className="w-4 h-4 text-amber-400" />}
                        {att.fileType === 'xlsx' && <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
                        {att.fileType === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                        {att.fileType === 'image' && <ImageIcon className="w-4 h-4 text-blue-400" />}
                        {att.fileType === 'other' && <FileText className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate text-[var(--text-main)]">{att.name}</div>
                        <div className="text-[10px] text-[var(--text-dim)] flex items-center gap-2">
                          <span>{att.sizeFormatted}</span>
                          <span>&bull;</span>
                          <span>Uploaded {att.uploadDate}</span>
                          <span>&bull;</span>
                          <span>By {att.uploadedBy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button
                        onClick={() => setPreviewingAttachment(att)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] text-[11px] font-semibold border border-[var(--border-main)]"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Preview / Info</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1 rounded hover:bg-rose-950/40 text-[var(--text-dim)] hover:text-rose-400"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* In-Modal Viewer for previewing selected attachment */}
            {previewingAttachment && (
              <div className="mt-4 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-main)] text-xs animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-main)] mb-3">
                  <div className="flex items-center gap-2 font-bold text-[var(--text-main)]">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span>Viewer: {previewingAttachment.name}</span>
                  </div>
                  <button onClick={() => setPreviewingAttachment(null)}>
                    <X className="w-4 h-4 text-[var(--text-dim)] hover:text-[var(--text-main)]" />
                  </button>
                </div>

                {previewingAttachment.fileType === 'image' && (
                  <div className="text-center">
                    <img
                      src={previewingAttachment.previewUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'}
                      alt={previewingAttachment.name}
                      className="max-h-56 mx-auto rounded-lg object-contain border border-[var(--border-main)]"
                    />
                    <div className="mt-2 text-[10px] text-[var(--text-dim)]">
                      High-resolution site photo verified.
                    </div>
                  </div>
                )}

                {previewingAttachment.fileType === 'cad_dwg' && (
                  <div className="p-4 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-1">
                      <span>AutoCAD DWG / DXF Engineering Vector Model</span>
                      <span className="text-[10px] uppercase">Layer Inspector</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>&bull; Layer 0: Conduit & Microduct Trenching</div>
                      <div>&bull; Layer 1: 48C / 96C Fiber Route As-Built</div>
                      <div>&bull; Layer 2: Utility Pole & Chamber Coordinates</div>
                      <div>&bull; Layer 3: Splice Enclosure GPS Waypoints</div>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Full vector geometry ready for Autodesk Civil 3D / QGIS export.
                    </div>
                  </div>
                )}

                {(previewingAttachment.fileType === 'xlsx' || previewingAttachment.fileType === 'pdf') && (
                  <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-main)] text-center space-y-2">
                    <div className="font-semibold text-[var(--text-main)]">
                      {previewingAttachment.fileType === 'xlsx' ? 'Excel Data Spreadsheet' : 'Official PDF Documentation'}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {previewingAttachment.notes || 'Optical power test log & splice matrix'}
                    </p>
                    <button
                      onClick={() => showToast(`Downloaded ${previewingAttachment.name}`, 'info')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File Copy</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row Add / Edit Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 text-[var(--text-main)] overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingRecord ? 'Edit' : 'Add New'} {activeIctType.toUpperCase()} Record
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Structured grid attributes and optical testing metrics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-dim)] hover:text-[var(--text-main)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              key={`${activeIctType}-${editingRecord ? editingRecord.id : 'new'}`}
              onSubmit={handleSaveRecord}
              className="mt-5 space-y-3.5 text-xs max-h-[72vh] overflow-y-auto pr-1"
            >
              {activeIctType === 'ftth' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Cluster ID
                      </label>
                      <input
                        type="text"
                        name="clusterId"
                        required
                        defaultValue={editingRecord?.clusterId || `ISB-FTTH-C${Date.now().toString().slice(-3)}`}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] font-mono text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Sector / Zone
                      </label>
                      <input
                        type="text"
                        name="zone"
                        required
                        defaultValue={editingRecord?.zone || 'Sector G-11/4 Phase 2'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Client Operator
                      </label>
                      <input
                        type="text"
                        name="clientOperator"
                        defaultValue={editingRecord?.clientOperator || 'PTCL / Nayatel'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Splitter Ratio
                      </label>
                      <select
                        name="splitterRatio"
                        defaultValue={editingRecord?.splitterRatio || '1:16'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      >
                        <option value="1:8">1:8 Splitter</option>
                        <option value="1:16">1:16 Splitter</option>
                        <option value="1:32">1:32 Splitter</option>
                        <option value="1:64">1:64 Splitter</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Homes Passed
                      </label>
                      <input
                        type="number"
                        name="homesPassed"
                        defaultValue={editingRecord?.homesPassed ?? 256}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        FAT Enclosures
                      </label>
                      <input
                        type="number"
                        name="fatsInstalled"
                        defaultValue={editingRecord?.fatsInstalled ?? 16}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Drop Cable (m)
                      </label>
                      <input
                        type="number"
                        name="dropCableMeters"
                        defaultValue={editingRecord?.dropCableMeters ?? 3200}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Optical Power (dBm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        name="opticalPowerDbm"
                        defaultValue={editingRecord?.opticalPowerDbm ?? -18.5}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Testing Status
                      </label>
                      <select
                        name="testingStatus"
                        defaultValue={editingRecord?.testingStatus || 'Passed'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      >
                        <option value="Passed">Passed (Loss &le; 24dBm)</option>
                        <option value="Pending">Pending QA Verification</option>
                        <option value="Attenuation Fault">Attenuation Fault</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Implementation Date
                      </label>
                      <input
                        type="date"
                        name="implementationDate"
                        defaultValue={editingRecord?.implementationDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Field Supervisor
                      </label>
                      <input
                        type="text"
                        name="supervisor"
                        defaultValue={editingRecord?.supervisor || currentUser?.fullName || 'Engr. Supervisor'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Cost Estimate ({homeCurrency})
                      </label>
                      <input
                        type="number"
                        step="1"
                        name="costEstimate"
                        defaultValue={editingRecord?.costEstimate ?? 0}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                    <div className="pt-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="isWorkDone"
                          defaultChecked={editingRecord?.isWorkDone ?? false}
                          className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-[var(--text-main)]">Mark as Work Done / Completed</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeIctType === 'fttb' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Building Name
                      </label>
                      <input
                        type="text"
                        name="buildingName"
                        required
                        defaultValue={editingRecord?.buildingName || 'Emirates Telecom Tower'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Building ID
                      </label>
                      <input
                        type="text"
                        name="buildingId"
                        defaultValue={editingRecord?.buildingId || `BLD-${Date.now().toString().slice(-4)}`}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Risers</label>
                      <input
                        type="number"
                        name="risersCount"
                        defaultValue={editingRecord?.risersCount ?? 2}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Floors</label>
                      <input
                        type="number"
                        name="floorsCount"
                        defaultValue={editingRecord?.floorsCount ?? 16}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Dist. Fibers</label>
                      <input
                        type="number"
                        name="distributionFibers"
                        defaultValue={editingRecord?.distributionFibers ?? 36}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">MDU Box Type</label>
                      <input
                        type="text"
                        name="mduBoxType"
                        defaultValue={editingRecord?.mduBoxType || 'Wall-Mount MDU 32-Port'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Active Ports</label>
                      <input
                        type="number"
                        name="activeCustomerPorts"
                        defaultValue={editingRecord?.activeCustomerPorts ?? 0}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Optical Power (dBm)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="opticalPowerDbm"
                        defaultValue={editingRecord?.opticalPowerDbm ?? -18.0}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Deployment Status</label>
                      <select
                        name="status"
                        defaultValue={editingRecord?.status || 'Commissioned'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      >
                        <option value="Survey Phase">Survey Phase</option>
                        <option value="Civil Works">Civil Works</option>
                        <option value="Splicing In-Progress">Splicing In-Progress</option>
                        <option value="Commissioned">Commissioned</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Handover Date</label>
                      <input
                        type="date"
                        name="handoverDate"
                        defaultValue={editingRecord?.handoverDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Field Supervisor</label>
                      <input
                        type="text"
                        name="supervisor"
                        defaultValue={editingRecord?.supervisor || currentUser?.fullName || 'Engr. Supervisor'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Cost Estimate ({homeCurrency})
                      </label>
                      <input
                        type="number"
                        step="1"
                        name="costEstimate"
                        defaultValue={editingRecord?.costEstimate ?? 0}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                    <div className="pt-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="isWorkDone"
                          defaultChecked={editingRecord?.isWorkDone ?? false}
                          className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-[var(--text-main)]">Mark as Work Done / Completed</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {activeIctType === 'fttm' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Cell Site ID
                      </label>
                      <input
                        type="text"
                        name="siteId"
                        required
                        defaultValue={editingRecord?.siteId || `BTS-${Date.now().toString().slice(-3)}-5G`}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono font-bold text-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Tower Name
                      </label>
                      <input
                        type="text"
                        name="towerName"
                        required
                        defaultValue={editingRecord?.towerName || 'Expressway Monopole Node Alpha'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Metro Ring Sector
                      </label>
                      <input
                        type="text"
                        name="metroSector"
                        defaultValue={editingRecord?.metroSector || 'Urban Arterial Ring 2'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        BTS / eNodeB ID
                      </label>
                      <input
                        type="text"
                        name="btsNodeId"
                        defaultValue={editingRecord?.btsNodeId || 'BTS-NODE-8812'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Backhaul Bandwidth
                      </label>
                      <input
                        type="text"
                        name="backhaulBandwidth"
                        defaultValue={editingRecord?.backhaulBandwidth || '10 Gbps Metro Ring'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        SFP Transceivers
                      </label>
                      <input
                        type="text"
                        name="sfpTransceivers"
                        defaultValue={editingRecord?.sfpTransceivers || '10G BiDi SFP+ 40km'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        OTDR Trace Distance (km)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        name="otdrDistanceKm"
                        defaultValue={editingRecord?.otdrDistanceKm ?? 10.5}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Total Link Loss (dB)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        name="attenuationDb"
                        defaultValue={editingRecord?.attenuationDb ?? 3.2}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Link Status</label>
                      <select
                        name="status"
                        defaultValue={editingRecord?.status || 'Live on Air'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      >
                        <option value="Fibers Spliced">Fibers Spliced</option>
                        <option value="Testing Phase">Testing Phase</option>
                        <option value="Live on Air">Live on Air</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Activation Date</label>
                      <input
                        type="date"
                        name="activationDate"
                        defaultValue={editingRecord?.activationDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">Lead Engineer</label>
                      <input
                        type="text"
                        name="leadEngineer"
                        defaultValue={editingRecord?.leadEngineer || currentUser?.fullName || 'Lead Network Engr'}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--text-muted)] mb-1">
                        Cost Estimate ({homeCurrency})
                      </label>
                      <input
                        type="number"
                        step="1"
                        name="costEstimate"
                        defaultValue={editingRecord?.costEstimate ?? 0}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-[var(--text-muted)] mb-1">
                  Engineering Notes & Handover Details
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingRecord?.notes || ''}
                  placeholder="Notes on fiber pathway, splicing chambers or NOC integration..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition shadow"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for ICT Record Deletion (FTTH, FTTB, FTTM) */}
      <ConfirmDeleteModal
        isOpen={!!recordToDelete}
        title={`Delete ${recordToDelete?.type || 'ICT'} Record`}
        itemName={recordToDelete?.name || ''}
        entityName={recordToDelete?.name || ''}
        itemType={`${recordToDelete?.type || 'ICT'} deployment`}
        entityType={`${recordToDelete?.type || 'ICT'} deployment record`}
        warningMessage={`This ${recordToDelete?.type || 'ICT'} deployment record and its field metrics will be permanently erased.`}
        onConfirm={handleConfirmDeleteRecord}
        onClose={() => setRecordToDelete(null)}
        onCancel={() => setRecordToDelete(null)}
        isDeleting={isDeletingRecord}
        isLoading={isDeletingRecord}
      />
    </div>
  );
};
