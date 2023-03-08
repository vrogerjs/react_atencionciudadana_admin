import React, { useState, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { db } from '../../db';
import {
  Button, Checkbox, Fab, styled, Table, TableCell, TextField, TablePagination,
  TableHead, TableBody, TableRow, TableContainer, Toolbar, Grid, MenuItem
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import { Autorenew, Keyboard } from '@mui/icons-material';
import { http, useResize, useFormState } from 'gra-react-utils';
import { tableCellClasses } from '@mui/material/TableCell';
import { useDispatch, useSelector } from "react-redux";
import {
  useNavigate
} from "react-router-dom";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    textAlign: 'center',
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const List = () => {

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [state, setState] = useState({ page: 0, rowsPerPage: 50 });

  const [result, setResult] = useState({ size: 0, data: [] });

  const [selected, setSelected] = React.useState([]);

  const isSelected = (code) => selected.indexOf(code) !== -1;

  const [dependencias, setDependencias] = useState([]);

  const networkStatus = useSelector((state) => state.networkStatus);

  const pad = (num, places) => String(num).padStart(places, '0')

  const onChangeAllRow = (event) => {
    if (event.target.checked) {
      const newSelected = result.data.map((row) => toID(row));
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const onClickRow = (event, code) => {
    const selectedIndex = selected.indexOf(code);

    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, code);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const emptyRows = result.data && result.data.length;

  const onPageChange = (
    event, page
  ) => {
    setState({ ...state, page: page });
  };

  const onRowsPerPageChange = (
    event
  ) => {
    setState({ ...state, rowsPerPage: event.target.value });
  };

  const onClickRefresh = () => {
    setSelected([]);
    fetchData(state.page);
  }

  const fetchData = async (page) => {
    var data = { data: [] };
    if (networkStatus.connected) {
      const result = await http.get(process.env.REACT_APP_BASE_URL + '/atencion/' + page + '/' + state.rowsPerPage + '?' + new URLSearchParams(o).toString() + '&activo=1');
      data.size = result.size;
      data.data = data.data.concat(result.content);

      const resultD = await (http.get(process.env.REACT_APP_BASE_URL + '/dependencia'));
      setDependencias(resultD);
    }
    setResult(data);
  };

  const { height, width } = useResize(React);

  useEffect(() => {
    const header = document.querySelector('.MuiToolbar-root');
    const tableContainer = document.querySelector('.MuiTableContainer-root');
    const nav = document.querySelector('nav');
    const toolbarTable = document.querySelector('.Toolbar-table');
    const tablePagination = document.querySelector('.MuiTablePagination-root');

    if (tableContainer) {
      tableContainer.style.width = (width - nav.offsetWidth) + 'px';
      tableContainer.style.height = (height - header.offsetHeight
        - toolbarTable.offsetHeight - tablePagination.offsetHeight) + 'px';
    }
  }, [height, width]);

  useEffect(() => {
    dispatch({ type: 'title', title: 'Administración de Tickets para Atención al Ciudadano - GORE Áncash' });
    fetchData(state.page)
  }, [state.page, state.rowsPerPage]);

  const [o, { defaultProps }] = useFormState(useState, {}, {});

  useEffect(() => {
    // if(o.dependencia)
    onClickRefresh();
    // alert(o.dependencia);
  }, [o.dependencia]);

  const createOnClick = () => {
    navigate('/atencion/create');
  };


  const atenderOnClick = () => {
    var hoy = new Date();
    var hora = pad(hoy.getHours(), 2) + ':' + pad(hoy.getMinutes(), 2) + ':' + pad(hoy.getSeconds(), 2);

    dispatch({
      type: "confirm", msg: 'Se realizo la atención al registro seleccionado?', cb: (e) => {
        if (e) {
          http.put('/atencion/' + selected[0], { activo: 0, horafin: hora }).then(e => {
            navigate('/atencion');
            dispatch({ type: "snack", msg: 'Ciudadano atendido satisfactoriamente!' });
          });
        }
      }
    });

  };

  const toID = (row) => {
    return row._id && row._id.$oid ? row._id.$oid : row.id;
  }
  return (
    <>
      <Toolbar className="Toolbar-table mt-1" direction="row" >
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button sx={{ width: 250, fontWeight: 'bold' }} disabled={!selected.length} startIcon={<EditIcon />} onClick={atenderOnClick} variant="contained" color="warning">Atender</Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button sx={{ width: 250, fontWeight: 'bold' }} onClick={onClickRefresh} endIcon={<Autorenew />} variant="contained" color="success">Actualizar</Button>
          </Grid>
          <Grid item xs={12} md={3}>
          </Grid>
        </Grid>
      </Toolbar>

      <Grid container spacing={2}>
        <Grid item xs={12} md={10} className='mb-2 ml-1 mr-1'>
          <TextField
            className='select'
            select
            margin="normal"
            required
            fullWidth
            id="standard-name"
            label="Seleccione la Dependencia a realizar la Busqueda: "
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

      <TableContainer sx={{ maxHeight: '100%' }}>
        {/* <Fab color="success" aria-label="add"
          onClick={createOnClick}
          style={{
            position: 'absolute',
            bottom: 72, right: 24
          }}>
          <AddIcon />
        </Fab> */}
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <StyledTableCell padding="checkbox" className='bg-gore border-table text-table'>
                <Checkbox
                  style={{ color: 'white' }}
                  indeterminate={selected.length > 0 && selected.length < result.data.length}
                  checked={result && result.data.length > 0 && selected.length === result.data.length}
                  onChange={onChangeAllRow}
                  inputProps={{
                    'aria-label': 'select all desserts',
                  }}
                />
              </StyledTableCell>
              <StyledTableCell style={{ minWidth: 80, maxWidth: 80 }} className='bg-gore border-table text-table'>Nº Expediente
                {/* <TextField {...defaultProps('dependencia')} style={{ padding: 0, marginTop: '5px !important' }} /> */}
              </StyledTableCell>
              <StyledTableCell style={{ minWidth: 80, maxWidth: 80 }} className='bg-gore border-table text-table'>Nº Documento
                {/* <TextField {...defaultProps('abreviatura')} style={{ padding: 0, marginTop: '5px !important' }} /> */}
              </StyledTableCell>
              <StyledTableCell style={{ minWidth: 150, maxWidth: 150 }} className='bg-gore border-table text-table'>Apellidos y Nombres
                {/* <TextField {...defaultProps('nombaperesponsable')} style={{ padding: 0, marginTop: '5px !important' }} /> */}
              </StyledTableCell>
              <StyledTableCell style={{ minWidth: 100, maxWidth: 100 }} className='bg-gore border-table text-table'>Razon Social
                {/* <TextField {...defaultProps('cargoresponsable')} style={{ padding: 0, marginTop: '5px !important' }} /> */}
              </StyledTableCell>
              <StyledTableCell style={{ minWidth: 80, maxWidth: 80 }} className='bg-gore border-table text-table'>Nº Celular
                {/* <TextField {...defaultProps('dependencia')} style={{ padding: 0, marginTop: '5px !important' }} /> */}
              </StyledTableCell>
              <StyledTableCell style={{ minWidth: 150, maxWidth: 150 }} className='bg-gore border-table text-table'>Dependencia
              </StyledTableCell>
              <StyledTableCell style={{ minWidth: 100, maxWidth: 100 }} className='bg-gore border-table text-table'>Fecha
                {/* <TextField {...defaultProps('cargoresponsable')} style={{ padding: 0, marginTop: '5px !important' }} /> */}
              </StyledTableCell>
              <StyledTableCell style={{ minWidth: 100, maxWidth: 100 }} className='bg-gore border-table text-table'>Hora de Cita
                {/* <TextField {...defaultProps('cargoresponsable')} style={{ padding: 0, marginTop: '5px !important' }} /> */}
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(result && result.data && result.data.length ? result.data : []).
              map((row, index) => {
                const isItemSelected = isSelected(toID(row));
                return (
                  <StyledTableRow
                    style={{ backgroundColor: (1) ? '' : (index % 2 === 0 ? '#f1f19c' : '#ffffbb') }}
                    hover
                    onClick={(event) => onClickRow(event, toID(row))}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={index + ' ' + toID(row)}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox" className='border-table text-table'>
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                      />
                    </TableCell>
                    <TableCell style={{ minWidth: 80, maxWidth: 80 }} className='border-table text-table' align="center">
                      {row.nroexpediente}
                    </TableCell>
                    <TableCell style={{ minWidth: 80, maxWidth: 80 }} className='border-table text-table' align="center">
                      {row.persona.nroDocumento}
                    </TableCell>
                    <TableCell style={{ minWidth: 150, maxWidth: 150 }} className='border-table text-table'>
                      {row.persona.nombape}
                    </TableCell>
                    <TableCell style={{ minWidth: 100, maxWidth: 100 }} className='border-table text-table'>
                      {row.persona.razonsocial}
                    </TableCell>
                    <TableCell style={{ minWidth: 80, maxWidth: 80 }} className='border-table text-table' align="center">
                      {row.persona.celular}
                    </TableCell>
                    <TableCell style={{ minWidth: 150, maxWidth: 150 }} className='border-table text-table'>
                      {row.dependencia.dependencia}
                    </TableCell>
                    <TableCell style={{ minWidth: 100, maxWidth: 100 }} className='border-table text-table' align="center">
                      <Button size='small' variant="contained" color="warning">
                        {row.fecha[2]}/{row.fecha[1]}/{row.fecha[0]}
                      </Button>
                    </TableCell>
                    <TableCell style={{ minWidth: 100, maxWidth: 100 }} className='border-table text-table' align="center">
                      <Button size='small' variant="contained" color="success">
                        {row.horaini}
                      </Button>
                    </TableCell>
                  </StyledTableRow >
                );
              })}
            {(!emptyRows) && (
              <TableRow style={{ height: 53 }}>
                <TableCell colSpan={7} >
                  No data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={result.size}
        rowsPerPage={state.rowsPerPage}
        page={state.page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </>
  );

};

export default List;