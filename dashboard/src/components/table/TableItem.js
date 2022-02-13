import React, { Component } from 'react';
import TableActionButton from './TableActionButtons'
import TableItemColumnData from './TableItemColumnData';

export default class TableItem extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { item, columns, onClick, actionButtons } = this.props;

        return (
            <tr
                className="Table-row db-ListViewItem bs-ActionsParent db-ListViewItem--hasLink statusPageListItem"
                onClick={() => onClick && onClick(item)}
            >

                {columns && columns.map((column) => {
                    if(!column.isActionColumn){
                        return (<TableItemColumnData item={item} column={column} />);
                    }else{
                        return <></>
                    }
                })}

                <TableActionButton actionButtons={actionButtons} item={item} />
            </tr>
        )
    }
}
