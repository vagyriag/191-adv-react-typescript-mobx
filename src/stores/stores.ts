import { observable, autorun, toJS, configure, action, computed } from 'mobx';
import firebase from 'firebase';

import credentials from '../firebaseCredentials';
firebase.initializeApp(credentials);

import api from '../utils/api';

export type depsArray = { name: string, department_id: number }[];
export type catsArray = { name: string, category_id: number, department_id: number }[];



class Store {

    @observable departments: depsArray|null = null;
    @observable loadingDeps: boolean = false;

    @observable categories: catsArray|null|false = null;

    @observable currentDept: number|null = null;
    @observable currentCat: number|null = null;

    @computed get pageTitle(){
        var dep = this.departments && this.departments.find(e => e.department_id == this.currentDept);
        var cat = this.categories && this.categories.find(e => e.category_id == this.currentCat);

        var res = `${dep ? dep.name : ''} ${cat ? ' - ' + cat.name : ''}`;
        return res;
    }

    @action getDepartments(){
        if(this.loadingDeps || this.departments) return;

        var depsLocal = localStorage.getItem('departments');
        var depsLocalTime = localStorage.getItem('departments_time');
        if(depsLocal && depsLocalTime && 
            Date.now() - parseInt(depsLocalTime) < 7 * 24 * 60 * 60 * 1000 ) {
            this.departments = JSON.parse(depsLocal);
            return;
        }

        this.loadingDeps = true;
        var callback = (result: depsArray) => {            
            localStorage.setItem('departments', JSON.stringify(toJS(result)));
            localStorage.setItem('departments_time', Date.now() + '');

            this.departments = result;
            this.loadingDeps = false;
        }
        api.getDepartments(callback);
    }

    @action setDepartment(id: number){
        this.currentDept = id;
        this.currentCat = null;
    }

    @action getCategories(){
        if(this.categories != null) return;

        this.categories = false;
        api.getCategories((result: catsArray) => {
            this.categories = result;
        });
    }

    @action setCategory(id: number){
        this.currentCat = id;
    }

    uploadFile(fileName: string, fileContent: string){
        let storage = firebase.storage().ref();
        let file = storage.child('gatos/'+fileName);
        file.putString(fileContent, 'data_url').then(function(snapshot) {
            console.log('Uploaded a base64url string!');
        });
    }
}

const store = new Store();

export default store;