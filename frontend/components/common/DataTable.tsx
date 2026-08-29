'use client';

import { useState } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Box, Button, Select, MenuItem, FormControl, InputLabel, TextField,
  Pagination, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  badge?: (value: any) => string;
}

interface DataTableProps<T> {
  title: string;
  subtitle?: string;
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  onNew?: () => void;
  newLabel?: string;
  filters?: {
    key: string;
    label: string;
    values: string[];
  }[];
  extraActions?: React.ReactNode;
}

export default function DataTable<T extends Record<string, any>>({
  title, subtitle, columns, data, searchPlaceholder = 'Buscar...',
  onNew, newLabel = 'Nueva', filters = [], extraActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const normalized = search.trim().toLowerCase();
  let filtered = data.filter((row) => {
    if (normalized) {
      const hay = columns.some((c) => {
        const v = row[c.key];
        return v !== undefined && String(v).toLowerCase().includes(normalized);
      });
      if (!hay) return false;
    }
    for (const f of filters) {
      const fv = filterState[f.key];
      if (fv && fv !== 'todos' && String(row[f.key]) !== fv) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {extraActions}
          {onNew && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={onNew}>
              {newLabel}
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          size="small"
          label={searchPlaceholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ minWidth: 200 }}
        />
        {filters.map((f) => (
          <FormControl key={f.key} size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{f.label}</InputLabel>
            <Select
              value={filterState[f.key] || 'todos'}
              label={f.label}
              onChange={(e) => { setFilterState({ ...filterState, [f.key]: e.target.value }); setPage(1); }}
            >
              <MenuItem value="todos">Todos</MenuItem>
              {f.values.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
            </Select>
          </FormControl>
        ))}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0d47a1' }}>
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  sx={{ fontWeight: 'bold', color: '#ffffff', borderBottom: '2px solid #0a3577', whiteSpace: 'nowrap' }}
                >
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((row, i) => (
              <TableRow key={i} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f4f6fa' } }}>
                {columns.map((c) => {
                  const value = row[c.key];
                  let node: React.ReactNode = value;
                  if (c.render) node = c.render(row);
                  else if (c.badge) node = <Chip size="small" label={value} color={c.badge(value) as any} />;
                  return <TableCell key={c.key} sx={{ borderBottom: '1px solid #e2e8f0' }}>{node}</TableCell>;
                })}
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow><TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>Sin resultados</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
      </Box>
    </Paper>
  );
}
