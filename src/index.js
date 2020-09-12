import { isArray, isEqual, omit } from 'lodash';
import diff from 'diff-arrays-of-objects';

class Datasource {
  constructor(setup) {
    this.omitKeys = ['selected', 'inEdit'];
    this.NEW = 'new';
    this.UPDATED = 'updated';
    this.EQUAL = 'equal';
    if (!setup) {
      this.log('You have to configure the datasource.');
      return;
    }

    this.data = isArray(setup.data) ? setup.data : [];
    this.idField = setup.idField || '';
    this.transport = setup.transport || '';
    this.http = setup.http || null;
  }

  read(online = true, params) {
    return new Promise((resolve, reject) => {
      if (online) {
        this.http
          .get(this.transport.url.read, {
            params: this.transport.parameterMap('read', params),
          })
          .then((resp) => {
            const data = resp.data.map((d) => this.transport.transform('read', { ...d }));

            this.data = data;
            resolve(data);
          })
          .catch((err) => reject(err));
      } else {
        resolve(this.data);
      }
    });
  }

  save(dataItem, params) {
    return new Promise((resolve, reject) => {
      const data = {
        ...dataItem,
        ...params,
      };

      this.http
        .post(
          this.transport.url.create,
          this.transport.parameterMap('create', data)
        )
        .then((resp) => {
          const response = this.transport.transform('create', { ...resp.data });
          this.data.unshift(response);
          resolve(response);
        })
        .catch((err) => reject(err));
    });
  }

  update(dataItem, params) {
    return new Promise((resolve, reject) => {
      const data = {
        ...dataItem,
        ...params,
      };

      this.http
        .put(
          `${this.transport.url.update}/${dataItem[this.idField]}`,
          this.transport.parameterMap('update', data)
        )
        .then((resp) => {
          const response = this.transport.transform('update', { ...resp.data });
          const index = this.data.findIndex(
            (d) => d[this.idField] === dataItem[this.idField]
          );
          this.data[index] = response;
          resolve(response);
        })
        .catch((err) => reject(err));
    });
  }

  remove(dataItem) {
    return new Promise((resolve, reject) => {
      this.http
        .delete(`${this.transport.url.remove}/${dataItem[this.idField]}`)
        .then((resp) => {
          const index = this.data.findIndex(
            (d) => d[this.idField] === dataItem[this.idField]
          );
          this.data.splice(index, 1);
          resolve(resp);
        })
        .catch((err) => reject(err));
    });
  }

  // Utilities

  /* eslint no-console: ["error", { allow: ["warn", "error"] }] */
  log = (message) => {
    console.error(`[Datasource Warn] ${message}`);
  }

  getDiff(items) {
    // remove selected field
    const clearItemsKeys = items.map(({ dselected, ...keepAttrs }) => keepAttrs);
    return diff(
      this.data,
      clearItemsKeys,
      this.idField
      // {
      //     updatedValues: diff.updatedValues.bothWithDeepDiff
      // }
    );
  }

  checkDataItemStatus(dataItem) {
    const item = this.data.find(
      (d) => d[this.idField] === dataItem[this.idField]
    );

    if (!item) return this.NEW;

    const result = isEqual(
      omit(item, this.omitKeys),
      omit(dataItem, this.omitKeys)
    );

    if (result) {
      return this.EQUAL;
    }

    return this.UPDATED;
  }
}

export default Datasource;
