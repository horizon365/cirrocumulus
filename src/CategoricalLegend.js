import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import React, {useState} from 'react';
import {IconButton, ListItem, ListItemText} from '@mui/material';
import {intFormat} from './formatters';
import {FixedSizeList} from 'react-window';
import MenuIcon from '@mui/icons-material/Menu';
import AutocompleteVirtualized from './AutocompleteVirtualized';
import FormControl from '@mui/material/FormControl';
import {FEATURE_TYPE, getCategoryValue} from './util';
import Link from '@mui/material/Link';

export default function CategoricalLegend(props) {
    const [contextMenu, setContextMenu] = useState(null);
    const [tmpName, setTmpName] = useState('');
    const [positiveMarkers, setPositiveMarkers] = useState([]);
    const [negativeMarkers, setNegativeMarkers] = useState([]);
    const [menu, setMenu] = useState(null);
    const [color, setColor] = useState(null);
    const [originalCategory, setOriginalCategory] = useState(null);

    function handleDialogClose(e) {
        setMenu(null);
    }

    function handleColorChange(e) {
        setColor(e.target.value);
    }

    function handleNameChange(e) {
        setTmpName(e.target.value);
    }

    function handleColorChangeApply(e) {
        props.handleColorChange({
            name: props.name,
            originalValue: originalCategory,
            color: color
        });
    }

    function handleNameChangeApply(e) {
        const name = tmpName.trim();
        props.handleNameChange({
            name: props.name,
            originalValue: originalCategory,
            newValue: name === '' ? null : name,
            positiveMarkers: positiveMarkers,
            negativeMarkers: negativeMarkers
        });
        setMenu(null);
    }

    function handleEditColor(e) {
        setContextMenu(null);
        setMenu('color');
    }

    function handleEditName(e) {
        setContextMenu(null);
        setMenu('name');

    }

    function handleContextmenuClose(e) {
        setContextMenu(null);
    }

    function onRowClick(event, category) {
        event.preventDefault();
        props.handleClick({
            name: props.name,
            value: category,
            shiftKey: event.shiftKey,
            metaKey: event.ctrlKey || event.metaKey
        });
    }

    function onContextmenu(event, originalCategory) {
        event.preventDefault();
        event.stopPropagation();

        setContextMenu({
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4
        });
        let cat = renamedCategories[originalCategory];
        if (cat == null) {
            cat = {};
        }
        setTmpName(cat.newValue != null ? cat.newValue : originalCategory);
        setNegativeMarkers(cat.negativeMarkers != null ? cat.negativeMarkers : []);
        setPositiveMarkers(cat.positiveMarkers != null ? cat.positiveMarkers : []);
        setOriginalCategory(originalCategory);
        setColor(props.scale(originalCategory));
    }


    const {
        scale,
        datasetFilter,
        name,
        height,
        features,
        featureSummary,
        globalFeatureSummary,
        categoricalNames,
        visible
    } = props;

    const categoricalFilter = datasetFilter[name];
    const selectionSummary = featureSummary[name];
    let selectedDimensionToCount = {};
    if (selectionSummary != null) {
        for (let i = 0; i < selectionSummary.counts.length; i++) {
            selectedDimensionToCount[selectionSummary.categories[i]] = selectionSummary.counts[i];
        }
    }
    const globalDimensionSummary = globalFeatureSummary[name];
    const categories = globalDimensionSummary.categories.slice(0); // make a copy so that when sorting, counts stays in same order as categories
    const renamedCategories = categoricalNames[name] || {};
    // if (sort === 'ascending' || sort === 'descending') {
    //     categories.sort((a, b) => {
    //         let renamed1 = renamedCategories[a];
    //         if (renamed1 != null) {
    //             a = renamed1;
    //         }
    //         let renamed2 = renamedCategories[b];
    //         if (renamed2 != null) {
    //             b = renamed2;
    //         }
    //         return NATSORT(a, b);
    //     });
    //     if (sort === 'descending') {
    //         categories.reverse();
    //     }
    // }

    function onNegativeMarkers(event, value) {
        setNegativeMarkers(value);
    }

    function onPositiveMarkers(event, value) {
        setPositiveMarkers(value);
    }

    function addFeatures(event, features) {
        props.handleSearchTokens(features, FEATURE_TYPE.X, false, false);
    }

    function renderRow(props) {
        const {index, style} = props;
        const category = categories[index];
        const categoryIndex = globalDimensionSummary.categories.indexOf(category);
        const isSelected = categoricalFilter != null && categoricalFilter.value.indexOf(category) !== -1;
        let renamedCategory = getCategoryValue(renamedCategories, category);

        return (
            <ListItem disableGutters={true} divider={true} dense={true}
                      onContextMenu={event => onContextmenu(event, category)}
                      onClick={event => onRowClick(event, category)}
                      selected={isSelected} button style={style}
                      key={index}>

                <div style={{
                    marginBottom: 15,
                    marginRight: 2,
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    background: scale(category)
                }}></div>

                <ListItemText title={renamedCategory} primaryTypographyProps={{noWrap: true}} primary={renamedCategory}
                              secondary={(selectionSummary == null ? '' : intFormat(selectedDimensionToCount[category] || 0) + ' / ') + intFormat(globalDimensionSummary.counts[categoryIndex])}/>
                <IconButton
                    onClick={event => onContextmenu(event, category)}
                    aria-label="menu"
                    size="large">
                    <MenuIcon></MenuIcon>
                </IconButton>
            </ListItem>
        );
    }


    if (!visible) {
        return null;
    }
    return (
        <>
            <div data-testid="categorical-legend">
                <FixedSizeList height={height} width={250} itemSize={40}
                               itemCount={categories.length}>
                    {renderRow}
                </FixedSizeList>
            </div>

            <Dialog open={Boolean(menu)} onClose={handleDialogClose}
                    aria-labelledby="edit-category-dialog-title" fullWidth={true}>
                {menu == 'color' && <>
                    <DialogTitle
                        id="edit-category-dialog-title">Edit {renamedCategories[originalCategory] != null ? renamedCategories[originalCategory].newValue : originalCategory} Color</DialogTitle>
                    <DialogContent>
                        <input type="color" value={color}
                               onChange={handleColorChange} style={{width: 100}}/>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDialogClose} color="primary">
                            Close
                        </Button>
                        <Button onClick={handleColorChangeApply} color="primary">
                            Apply
                        </Button>
                    </DialogActions>
                </>}
                {menu == 'name' && <>
                    <DialogTitle
                        id="edit-category-dialog-title">Annotate {renamedCategories[originalCategory] != null ? renamedCategories[originalCategory].newValue : originalCategory}</DialogTitle>
                    <DialogContent>

                        <TextField
                            size={"small"}
                            inputProps={{maxLength: 1000}}
                            fullWidth={true}
                            type="text"
                            required={false}
                            autoComplete="off"
                            value={tmpName}
                            onChange={handleNameChange}
                            margin="dense"
                            label={"Category Name"}
                            helperText={"Enter cell type or other annotation"}
                        />


                        <FormControl sx={{display: 'block'}}>
                            <AutocompleteVirtualized
                                textFieldSx={{width: '90%'}}
                                label={"Positive Genes/Features"}
                                options={features}
                                value={positiveMarkers}
                                onChange={onPositiveMarkers}
                            />
                            <div><Link
                                style={{
                                    float: 'right',
                                    marginRight: 4,
                                    fontSize: '0.75rem',
                                    transform: 'translateY(-20px)',
                                    display: positiveMarkers.length === 0 ? 'none' : ''
                                }}
                                onClick={e => addFeatures(e, positiveMarkers)}>View All</Link></div>
                        </FormControl>


                        <FormControl sx={{display: 'block'}}>
                            <AutocompleteVirtualized
                                label={"Negative Genes/Features"}
                                options={features}
                                value={negativeMarkers}
                                onChange={onNegativeMarkers}
                            />
                            <div><Link
                                style={{
                                    float: 'right',
                                    marginRight: 4,
                                    fontSize: '0.75rem',
                                    transform: 'translateY(-20px)',
                                    display: negativeMarkers.length === 0 ? 'none' : ''
                                }}
                                onClick={e => addFeatures(e, negativeMarkers)}>View All</Link></div>
                        </FormControl>

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDialogClose} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleNameChangeApply} color="primary">
                            OK
                        </Button>
                    </DialogActions>
                </>}
            </Dialog>
            <Menu
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu != null
                        ? {top: contextMenu.mouseY, left: contextMenu.mouseX}
                        : undefined
                }
                open={Boolean(contextMenu)}
                onClose={handleContextmenuClose}
            >
                <MenuItem onClick={handleEditName}>Annotate</MenuItem>
                <MenuItem onClick={handleEditColor}>Edit Color</MenuItem>
            </Menu>
        </>
    );

}

