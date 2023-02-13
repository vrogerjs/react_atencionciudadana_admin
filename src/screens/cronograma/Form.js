import React, { useState, useEffect, createRef } from 'react';
import { useFormState, useResize, http } from 'gra-react-utils';
import { VRadioGroup } from '../../utils/useToken';
import { db } from '../../db';

import {
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Add as AddIcon,
  Room as RoomIcon,
  Search as SearchIcon,
  Keyboard,
  ReplyAll,
  WifiProtectedSetup
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Accordion, AccordionSummary, AccordionDetails, Alert,
  Box, Button, Card, CardContent, Checkbox, Fab,
  FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Radio,
  Stack, InputAdornment, IconButton, TextField, Grid, Typography
} from '@mui/material';
import {
  useNavigate, useParams, useLocation
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Geolocation } from '@capacitor/geolocation';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { ClockPicker } from '@mui/x-date-pickers/ClockPicker';

export const Form = () => {

  const dispatch = useDispatch();

  const networkStatus = useSelector((state) => state.networkStatus);

  const { pid } = useParams();

  const formRef = createRef();

  const navigate = useNavigate();

  const [dependencias, setDependencias] = useState([]);

  const [state, setState] = useState({ page: 0, rowsPerPage: 50 });

  const [o, { defaultProps, handleChange, bindEvents, validate, set }] = useFormState(useState, {

  }, {});

  let days = { 2: 'Lunes', 3: 'Martes', 4: 'Miercoles', 5: 'Jueves', 6: 'Viernes' };

  useEffect(() => {
    dispatch({ type: 'title', title: (pid ? 'Actualizar' : 'Registrar') + ' Dependencia' });
    [].forEach(async (e) => {
      e[1](await db[e[0]].toArray());
    });
  }, []);

  const pad = (num, places) => String(num).padStart(places, '0')

  useEffect(() => {
    if (pid) {
      if (networkStatus.connected) {
        http.get('http://localhost:8080/cronograma/' + pid).then((result) => {
          result.dependencia = result.dependencia.id;
          var target = new Date("2023-08-02T" + result.horaini);
          result.horaini = target;
          var target = new Date("2023-08-02T" + result.horafin);
          result.horafin = target;
          set(result);
        });
      }
    } else {
      try {
        var s = localStorage.getItem("setting");
        if (s) {
          s = JSON.parse(s);
          var o2 = {};
          o2.dependencia = s.dependencia;
          o2.abreviatura = s.abreviatura;
          o2.nombaperesponsable = s.nombaperesponsable;
          o2.cargoresponsable = s.cargoresponsable;
          set({ ...o, ...o2 });
        }
      } catch (e) {
        console.log(e);
      }
    }
  }, [pid]);

  const { width, height } = useResize(React);

  useEffect(() => {
    if (formRef.current) {
      const header = document.querySelector('.MuiToolbar-root');
      const [body, toolBar] = formRef.current.children;
      const nav = document.querySelector('nav');
      body.style.height = (height - header.offsetHeight - toolBar.offsetHeight) + 'px';
      toolBar.style.width = (width - nav.offsetWidth) + 'px';
    }
  }, [width, height]);

  useEffect(() => {
    dispatch({ type: 'title', title: 'Administración de Tickets para Atención al Ciudadano - GORE Áncash' });
    fetchData(state.page)
  }, [state.page, state.rowsPerPage]);

  const fetchData = async (page) => {
    var data = { data: [] };
    if (networkStatus.connected) {
      const resultD = await (http.get('http://localhost:8080/dependencia'));
      setDependencias(resultD);
    }
  };

  const onClickCancel = () => {
    navigate(-1);
  }

  const onClickAdd = async () => {
    navigate('/dependencia/create', { replace: true });
  }

  const onClickSave = async () => {

    const form = formRef.current;
    if (0 || form != null && validate(form)) {
      horaini = o.horaini.toDate ? o.horaini.toDate() : o.horaini;
      horafin = o.horafin.toDate ? o.horafin.toDate() : o.horafin;

      var horaini = pad(horaini.getHours(), 2) + ":" + pad(horaini.getMinutes(), 2) + ":" + pad(horaini.getSeconds(), 2);
      var horafin = pad(horafin.getHours(), 2) + ":" + pad(horafin.getMinutes(), 2) + ":" + pad(horafin.getSeconds(), 2);

      var o2 = { ...o, horaini: horaini, horafin: horafin, texto:days[o.dia] };

      if (networkStatus.connected) {
        o2.dependencia = { id: o.dependencia };
        http.post('http://localhost:8080/cronograma', o2).then(async (result) => {
          console.log(result);
          if (!o2._id) {
            if (result.id) {
              // navigate('/dependencia/' + result.id + '/edit', { replace: true });
              dispatch({ type: "snack", msg: 'Registro grabado!' });
              navigate('/cronograma', { replace: true });
            }
            else {
              navigate(-1);
            }
          }
        });
      } else {
        console.log("devulve", o2);

        if (!o2.id) {
          o2.tmpId = 1 * new Date();
          o2.id = -o2.tmpId;
          //await db.disabled.add(o2);
          navigate('/' + o2.id + '/edit', { replace: true });
        } else {
          //await db.disabled.update(o2.id, o2);
        }
        dispatch({ type: "snack", msg: 'Registro grabado!' });
      }
    } else {
      dispatch({ type: "alert", msg: 'Falta campos por completar!' });
    }
  };

  const onSubmit = data => console.log(data);

  const theme = createTheme({
    components: {
      // Name of the component ⚛️
      MuiInput: {
        defaultProps: {
          required: true
        }
      },
    },
  });

  function getActions() {
    return <>
      <Button variant="contained" onClick={onClickCancel} color="error">
        Cancelar
      </Button>
      <Button disabled={o.old && !o.confirm} variant="contained" onClick={onClickSave} color="success" endIcon={<SendIcon />}>
        Grabar
      </Button>
    </>
  }

  function onChangeHoraini(v) {
    set(o => ({ ...o, horaini: v }), () => {
      o.horaini = v;
      console.log(o)
    });

  }

  function onChangeHorafin(v) {
    set(o => ({ ...o, horafin: v }), () => {
      o.horafin = v;
      console.log(o)
    });

  }

  function getContent() {
    return <LocalizationProvider dateAdapter={AdapterDayjs}><ThemeProvider theme={theme}>
      <form ref={formRef} onSubmit={onSubmit} style={{ textAlign: 'left' }}>
        <Box style={{ overflow: 'auto' }}>

          <Card className='mt-1 bs-black'>

            <CardContent>
              <Typography gutterBottom variant="h5" component="div" className='text-center fw-bold color-gore'>
                DATOS DEL CRONOGRAMA
              </Typography>

              <Typography variant="body2" color="text.secondary">
                <Grid container>
                  <Grid item xs={12} md={12}>
                    <TextField
                      className='select'
                      select
                      margin="normal"
                      required
                      fullWidth
                      id="standard-name"
                      label="Seleccione la Dependencia: "
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Keyboard />
                          </InputAdornment>
                        ),
                      }}
                      {...defaultProps("dependencia")}
                    >
                      {dependencias.map((item, i) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.dependencia}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      className='select'
                      select
                      margin="normal"
                      required
                      fullWidth
                      id="standard-name"
                      label="Seleccione el día de la Semana: "
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Keyboard />
                          </InputAdornment>
                        ),
                      }}
                      {...defaultProps("dia")}
                    >
                      {Object.keys(days).map((key) => (
                        <MenuItem key={key} value={key}>
                          {days[key]}
                        </MenuItem>
                      ))}

                      {/* <MenuItem value={2}>Lunes</MenuItem>
                      <MenuItem value={3}>Martes</MenuItem>
                      <MenuItem value={4}>Miercoles</MenuItem>
                      <MenuItem value={5}>Jueves</MenuItem>
                      <MenuItem value={6}>Viernes</MenuItem> */}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TimePicker
                      ampm={false}
                      openTo="hours"
                      views={['hours', 'minutes', 'seconds']}
                      inputFormat="HH:mm:ss"
                      mask="__:__:__"
                      label="Hora Inicio:"
                      onChange={onChangeHoraini}
                      value={o.horaini || ''}
                      renderInput={(params) =>
                        <TextField
                          margin="normal"
                          required={false}
                          fullWidth
                          size="medium"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Keyboard />
                              </InputAdornment>
                            ),
                          }}
                          {...params}
                        />
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TimePicker
                      ampm={false}
                      openTo="hours"
                      views={['hours', 'minutes', 'seconds']}
                      inputFormat="HH:mm:ss"
                      mask="__:__:__"
                      label="Hora Fin:"
                      onChange={onChangeHorafin}
                      value={o.horafin || ''}
                      renderInput={(params) =>
                        <TextField
                          margin="normal"
                          required={false}
                          fullWidth
                          size="medium"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Keyboard />
                              </InputAdornment>
                            ),
                          }}
                          {...params}
                        />
                      }
                    />
                  </Grid>
                </Grid>

                <Grid container>
                  <Grid item xs={12} md={12}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      size="medium"
                      id="standard-name"
                      label="Ingrese la cantidad máxima de tickets a generar: "
                      placeholder="Cantidad máxima"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Keyboard />
                          </InputAdornment>
                        ),
                      }}
                      {...defaultProps("limite")}
                    />
                  </Grid>
                </Grid>

              </Typography>
            </CardContent>
          </Card>

        </Box>
        <Stack direction="row" justifyContent="center"
          style={{ padding: '10px', backgroundColor: '#0f62ac' }}
          alignItems="center" spacing={1}>
          {getActions()}
        </Stack>

        {(o._id || o.id) && <Fab color="primary" aria-label="add"
          onClick={onClickAdd}
          style={{
            position: 'absolute',
            bottom: 80, right: 24
          }}>
          <AddIcon />
        </Fab>}
      </form>
    </ThemeProvider></LocalizationProvider>
  }
  return <>{
    1 == 1 ? <Box style={{ textAlign: 'left' }}>{getContent()}</Box>
      : <Box
        sx={{ display: 'flex' }}>
      </Box>
  }
  </>;

}