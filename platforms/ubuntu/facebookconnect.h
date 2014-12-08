/*
 *
 * Copyright 2014 Canonical Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

#ifndef _FACEBOOKCONNECT_H_FASCKL56452
#define _FACEBOOKCONNECT_H_FASCKL56452

#include <QtCore>
#include <cplugin.h>

class Facebookconnect: public CPlugin {
    Q_OBJECT
public:
    explicit Facebookconnect(Cordova *cordova);

    virtual const QString fullName() override {
        return Facebookconnect::fullID();
    }

    virtual const QString shortName() override {
        return Facebookconnect::fullID();
    }

    static const QString fullID() {
        return "FacebookConnectPlugin";
    }
public slots:
    void getLoginStatus(int, int);
    void login(int, int, const QList<QString> &);
    void getAccessToken(int, int);
    void logout(int, int);
private:
    void _login(int, int, const QList<QString> &);
    bool hasFacebookAccount();

    QString _token;
    QString _appId;
    QString _appName;
};
#endif
