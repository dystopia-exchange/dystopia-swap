import { useTheme, withTheme } from '@mui/styles';
import { Box, IconButton } from '@mui/material';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from '@mui/icons-material';
import React, { useState } from 'react';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

function TablePaginationActions(props) {
  const theme = useTheme();
  const {count, page, rowsPerPage, onPageChange} = props;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{flexShrink: 0, ml: 2.5}}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
        style={{
          width: windowWidth > 660 ? 30 : 25,
          height: windowWidth > 660 ? 30 : 25,
          border: '1px solid #86B9D6',
          borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
        }}>
        {theme.direction === 'rtl'
          ? <KeyboardDoubleArrowRight style={{transform: windowWidth > 660 ? 'none' : 'scale(0.7)'}}/>
          : <KeyboardDoubleArrowLeft style={{transform: windowWidth > 660 ? 'none' : 'scale(0.7)'}}/>}
      </IconButton>

      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
        style={{
          width: windowWidth > 660 ? 30 : 25,
          height: windowWidth > 660 ? 30 : 25,
          marginLeft: 10,
          border: '1px solid #86B9D6',
          borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
        }}>
        {theme.direction === 'rtl'
          ? <KeyboardArrowRight style={{transform: windowWidth > 660 ? 'none' : 'scale(0.7)'}}/>
          : <KeyboardArrowLeft style={{transform: windowWidth > 660 ? 'none' : 'scale(0.7)'}}/>}
      </IconButton>

      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
        style={{
          width: windowWidth > 660 ? 30 : 25,
          height: windowWidth > 660 ? 30 : 25,
          marginLeft: 10,
          border: '1px solid #86B9D6',
          borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
        }}>
        {theme.direction === 'rtl'
          ? <KeyboardArrowLeft style={{transform: windowWidth > 660 ? 'none' : 'scale(0.7)'}}/>
          : <KeyboardArrowRight style={{transform: windowWidth > 660 ? 'none' : 'scale(0.7)'}}/>}
      </IconButton>

      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
        style={{
          width: windowWidth > 660 ? 30 : 25,
          height: windowWidth > 660 ? 30 : 25,
          marginLeft: 10,
          border: '1px solid #86B9D6',
          borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
        }}>
        {theme.direction === 'rtl'
          ? <KeyboardDoubleArrowLeft style={{transform: windowWidth > 660 ? 'none' : 'scale(0.7)'}}/>
          : <KeyboardDoubleArrowRight style={{transform: windowWidth > 660 ? 'none' : 'scale(0.7)'}}/>}
      </IconButton>
    </Box>
  );
}

export default withTheme(TablePaginationActions);
