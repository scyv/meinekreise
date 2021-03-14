import { ReactiveVar } from "meteor/reactive-var";

export class ReactiveStorage {
    handle(name, initial) {
        let reactive;
        const localStorageVal = localStorage.getItem(name);
        if (localStorageVal) {
            reactive = new ReactiveVar(JSON.parse(localStorageVal));
        } else {
            localStorage.setItem(name, JSON.stringify(initial));
            reactive = new ReactiveVar(initial);
        }
        reactive.set = function (newValue) {
            const stringifiedNew = JSON.stringify(newValue);
            const stringifiedOld = JSON.stringify(reactive.curValue);
            if ((reactive.equalsFunc || ReactiveVar._isEqual)(stringifiedOld, stringifiedNew)) {
                return;
            }
            reactive.curValue = newValue;
            localStorage.setItem(name, stringifiedNew);
            reactive.dep.changed();
        };

        return reactive;
    }
}

export const resetStorage = () => {
    masterKey.set(null);
};

const storage = new ReactiveStorage();
export const masterKey = storage.handle("masterKey", "");
