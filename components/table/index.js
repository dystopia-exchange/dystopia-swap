import React from 'react'
import { useAppThemeContext } from '../../ui/AppThemeProvider'
import css from './table.module.css'

export const TableBodyPlaceholder = (props) => {
    const {appTheme} = useAppThemeContext();

    return (
        <div className={[
            css.tableBodyWrapper,
            css[`tableBodyWrapper--${appTheme}`],
          ].join(' ')}
        >
            {props.loading && (
                <div className={css.tableBodyLoader}></div>
            )}
            <div className={css.tableBodyMessage}>
                {props.message}
            </div>
        </div>
    )
}