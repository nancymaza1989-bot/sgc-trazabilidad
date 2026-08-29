'use client';

import { Box, Breadcrumbs, Link as MuiLink, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import Link from 'next/link';
import { LOGO_BALANZA } from '@/lib/theme';

export function PageBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: 13, mb: 0.5 }}>
      <MuiLink component={Link} href="/dashboard" underline="hover" color="inherit" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13 }}>
        <span>{LOGO_BALANZA}</span> Inicio
      </MuiLink>
      {items.map((it, i) =>
        it.href ? (
          <MuiLink key={i} component={Link} href={it.href} underline="hover" color="inherit" sx={{ fontSize: 13 }}>
            {it.label}
          </MuiLink>
        ) : (
          <Typography key={i} color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
            {it.label}
          </Typography>
        ),
      )}
    </Breadcrumbs>
  );
}

interface PageHeaderProps {
  titulo: string;
  descripcion?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export default function PageHeader({ titulo, descripcion, breadcrumb, actions }: PageHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        mb: 2.5,
        pb: 2,
        borderBottom: '3px solid #0d47a1',
      }}
    >
      {breadcrumb && <PageBreadcrumb items={breadcrumb} />}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'flex-end'}
        spacing={1.5}
      >
        <Box>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight="bold"
            sx={{ color: '#0d47a1', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {titulo}
          </Typography>
          {descripcion && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 760 }}>
              {descripcion}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
      </Stack>
    </Box>
  );
}
