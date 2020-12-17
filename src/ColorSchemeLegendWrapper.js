import {InputLabel} from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import {debounce} from 'lodash';
import React from 'react';
import ContinuousLegend from './ContinuousLegend';
import MeasureFilter from './MeasureFilter';

class ColorSchemeLegendWrapper extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {min: '', max: ''};
        this.onMinUpdate = debounce(this.onMinUpdate, 500);
        this.onMaxUpdate = debounce(this.onMaxUpdate, 500);

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.name !== this.props.name) {
            this.setState({
                min: '',
                max: ''
            });
        }
    }

    onMinChange = (event) => {
        this.setState({min: event.target.value});
        this.onMinUpdate(parseFloat(event.target.value));
    };

    onMinUpdate = (value) => {
        if (isNaN(value)) {
            delete this.props.globalFeatureSummary[this.props.name].customMin;
        } else {
            this.props.globalFeatureSummary[this.props.name].customMin = value;
        }
        this.props.handleDomain({name: this.props.name, summary: this.props.globalFeatureSummary[this.props.name]});
    };

    onMaxChange = (event) => {
        this.setState({max: event.target.value});
        this.onMaxUpdate(parseFloat(event.target.value));
    };

    onMaxUpdate = (value) => {

        if (isNaN(value)) {
            delete this.props.globalFeatureSummary[this.props.name].customMax;
        } else {
            this.props.globalFeatureSummary[this.props.name].customMax = value;
        }

        this.props.handleDomain({name: this.props.name, summary: this.props.globalFeatureSummary[this.props.name]});

    };

    render() {
        const {
            scale,
            name,
            nObs,
            nObsSelected,
            featureSummary,
            globalFeatureSummary,
            maxHeight,
            datasetFilter,
            handleUpdate,
            selected
        } = this.props;
        let style = {display: 'inline-block', verticalAlign: 'top'};
        if (this.props.style) {
            style = Object.assign({}, style, this.props.style);
        }

        return (
            <div className="cirro-condensed" style={style}>
                {/*ContinuousLegend shows stats table */}
                <ContinuousLegend name={name}
                                  selected={selected}
                                  summary={scale.summary}
                                  featureSummary={featureSummary}
                                  nObs={nObs}
                                  nObsSelected={nObsSelected}
                                  globalFeatureSummary={globalFeatureSummary}
                                  maxHeight={maxHeight}></ContinuousLegend>
                {name !== '__count' && this.props.handleDomain &&
                <InputLabel shrink={true} variant={"standard"}>Custom Color Scale</InputLabel>}
                {name !== '__count' && this.props.handleDomain &&
                <TextField InputLabelProps={{shrink: true}} margin="none"
                           style={{maxWidth: 60, marginRight: 4, marginTop: 0}}
                           size="small" type="text"

                           onChange={this.onMinChange} label="Min"
                           value={this.state.min}/>}
                {name !== '__count' && this.props.handleDomain &&
                <TextField InputLabelProps={{shrink: true}} margin="none" style={{maxWidth: 60, marginTop: 0}}
                           size="small"
                           type="text"

                           onChange={this.onMaxChange} label="Max"
                           value={this.state.max}/>}
                {name !== '__count' &&
                <MeasureFilter datasetFilter={datasetFilter} name={name} handleUpdate={handleUpdate}/>}
                {/*{this.props.showColorScheme &&*/}
                {/*<ColorSchemeLegend width={this.props.width} height={this.props.height} style={{paddingLeft: 10}}*/}
                {/*                   scale={scale}*/}
                {/*                   label={this.props.label}></ColorSchemeLegend>}*/}
            </div>);

    }
}

export default ColorSchemeLegendWrapper;
