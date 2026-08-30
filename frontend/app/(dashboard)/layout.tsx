'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { CircularProgress, Stack } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Divider, Avatar, Menu, MenuItem,
  useMediaQuery, Tooltip,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { MENU_SECCIONES } from '@/lib/menu';
import { LOGO_BALANZA, PJ_COLORS } from '@/lib/theme';
import ChatbotFlotante from '@/components/ChatbotFlotante';

const DRAWER_WIDTH = 264;

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  px: 2,
}));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const cargandoSesion = status === 'loading';

  useEffect(() => {
    const token = (session as any)?.user?.access_token;
    if (token) {
      localStorage.setItem('access_token', token);
    }
  }, [session]);

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const toggleDrawer = () => setOpen(!open);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    handleClose();
    localStorage.removeItem('access_token');
    await signOut({ callbackUrl: '/login' });
  };

  if (cargandoSesion) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: PJ_COLORS.background }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">Cargando sesión…</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Barra superior institucional */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: PJ_COLORS.primaryDark }}>
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 1.5 }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Box sx={{ fontSize: 30, lineHeight: 1 }}>{LOGO_BALANZA}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
                SGC - Trazabilidad
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ opacity: 0.85, display: 'block' }}
              >
                Gerencia de Gestión de Calidad · Poder Judicial del Perú
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Perfil del usuario">
            <IconButton onClick={handleMenu} size="small" sx={{ ml: 2 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: PJ_COLORS.secondary }}>
                {(session?.user?.name || 'A').charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem disabled>
              <Box sx={{ py: 0.5 }}>
                <Typography variant="body2" fontWeight="bold">
                  {session?.user?.name || 'Usuario'}
                </Typography>
                <Typography component="span" variant="caption" color="text.secondary">
                  {session?.user?.email}
                </Typography>
                <br />
                <Typography component="span" variant="caption" color="primary" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                  Rol: {session?.user?.role || '—'}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Barra lateral */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={toggleDrawer}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: `1px solid ${PJ_COLORS.divider}`, bgcolor: '#ffffff' },
        }}
      >
        <Toolbar />
        <Divider />
        <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 1, py: 1 }}>
          {MENU_SECCIONES.map((seccion) => (
            <Box key={seccion.titulo} sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  px: 2,
                  mb: 0.5,
                  fontWeight: 700,
                  color: PJ_COLORS.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: 11,
                }}
              >
                {seccion.titulo}
              </Typography>
              <List component="nav" disablePadding>
                {seccion.items.map((item) => {
                  const active = pathname === item.ruta;
                  return (
                    <ListItem key={item.ruta} disablePadding sx={{ display: 'block' }}>
                      <ListItemButton
                        onClick={() => { router.push(item.ruta); if (isMobile) setOpen(false); }}
                        sx={{
                          borderRadius: 1.5,
                          mb: 0.25,
                          minHeight: 40,
                          justifyContent: 'initial',
                          pl: 2,
                          bgcolor: active ? PJ_COLORS.primaryLight : 'transparent',
                          color: active ? PJ_COLORS.primaryDark : 'inherit',
                          borderLeft: active ? `4px solid ${PJ_COLORS.primary}` : '4px solid transparent',
                          fontWeight: active ? 'bold' : 'normal',
                          '&:hover': { bgcolor: PJ_COLORS.primaryLight },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 34, color: active ? PJ_COLORS.primary : 'inherit' }}>
                          <Box component="span" sx={{ fontSize: 18 }}>{item.icono}</Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={item.titulo}
                          primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500 }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>

        {/* Footer del sidebar */}
        <Box sx={{ p: 1.5, borderTop: `1px solid ${PJ_COLORS.divider}`, bgcolor: PJ_COLORS.primaryDark }}>
          <Typography variant="caption" sx={{ color: '#cfd8e6', display: 'block', textAlign: 'center' }}>
            SGC-Trazabilidad · v1.0
          </Typography>
        </Box>
      </Drawer>

      {/* Contenido */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: PJ_COLORS.background,
          minHeight: '100vh',
          pt: 10,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flexGrow: 1 }}>{children}</Box>
        <Box
          component="footer"
          sx={{
            mt: 4,
            pt: 2,
            borderTop: `1px solid ${PJ_COLORS.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            color: 'text.secondary',
          }}
        >
          <Typography variant="caption">
            © 2026 Poder Judicial del Perú · Gerencia de Gestión de Calidad
          </Typography>
          <Typography variant="caption">Av. Paseo de la República S/N · Palacio de Justicia · Lima</Typography>
        </Box>
      </Box>
      <ChatbotFlotante />
    </Box>
  );
}
