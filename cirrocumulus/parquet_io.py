import gzip
import logging
import os

import numpy as np
import pandas._libs.json as ujson
import pyarrow as pa
import pyarrow.parquet as pq
import scipy.sparse

from cirrocumulus.anndata_util import DataType

logger = logging.getLogger("cirro")


def write_pq(d, output_dir, name, write_statistics=True, row_group_size=None):
    os.makedirs(output_dir, exist_ok=True)
    pq.write_table(pa.Table.from_pydict(d), os.path.join(output_dir, name + '.parquet'),
                   write_statistics=write_statistics, row_group_size=row_group_size)


def save_adata_pq(datasets, schema, output_directory):
    if not output_directory.lower().endswith('.cpq'):
        output_directory += '.cpq'
    X_dir = os.path.join(output_directory, 'X')
    module_dir = os.path.join(output_directory, 'X_module')
    obs_dir = os.path.join(output_directory, 'obs')
    obsm_dir = os.path.join(output_directory, 'obsm')
    os.makedirs(X_dir, exist_ok=True)
    os.makedirs(obs_dir, exist_ok=True)
    os.makedirs(obsm_dir, exist_ok=True)
    with gzip.open(os.path.join(output_directory, 'index.json.gz'), 'wt') as f:
        # json.dump(result, f)
        f.write(ujson.dumps(schema, double_precision=2, orient='values'))
    for dataset in datasets:
        if dataset.uns.get('data_type') == DataType.MODULE:
            os.makedirs(module_dir, exist_ok=True)
            save_adata_X(dataset, module_dir)
        else:
            save_adata_X(dataset, X_dir)
        save_data_obs(dataset, obs_dir)
        save_data_obsm(dataset, obsm_dir)


def save_adata_X(adata, X_dir):
    adata_X = adata.X
    names = adata.var.index
    is_sparse = scipy.sparse.issparse(adata_X)
    if is_sparse and scipy.sparse.isspmatrix_csr(adata_X):
        adata_X = adata_X.tocsc()
    output_dir = X_dir
    for j in range(adata_X.shape[1]):
        X = adata_X[:, j]
        if is_sparse:
            X = X.toarray().flatten()
        filename = names[j]

        if is_sparse:
            indices = np.where(X != 0)[0]
            values = X[indices]
            write_pq(dict(index=indices, value=values), output_dir, filename)
        else:
            write_pq(dict(value=X), output_dir, filename)
        if j > 0 and (j + 1) % 1000 == 0:
            logger.info('Wrote adata X {}/{}'.format(j + 1, adata_X.shape[1]))


def save_data_obsm(adata, obsm_dir):
    logger.info('writing adata obsm')

    for name in adata.obsm.keys():
        m = adata.obsm[name]
        dim = m.shape[1]
        if 1 < dim <= 3:
            d = {}
            for i in range(dim):
                d[name + '_' + str(i + 1)] = m[:, i].astype('float32')
            write_pq(d, obsm_dir, name)


def save_data_obs(adata, obs_dir):
    logger.info('writing adata obs')
    for name in adata.obs:
        # TODO sort?
        value = adata.obs[name]
        write_pq(dict(value=value), obs_dir, name)
    write_pq(dict(value=adata.obs.index.values), obs_dir, 'index')
