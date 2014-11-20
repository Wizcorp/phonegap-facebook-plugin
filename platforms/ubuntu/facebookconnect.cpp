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

#include "facebookconnect.h"
#include <cordova.h>

#include <QtQuick>
#include <online-accounts-client/setup.h>
#include <Accounts/Manager>
#include <Accounts/Application>
#include <Accounts/AccountService>
#include <SignOn/Identity>
#include <SignOn/SessionData>

static QString appId() {
    return QCoreApplication::applicationName() + "_cordova";
}

Facebookconnect::Facebookconnect(Cordova *cordova): CPlugin(cordova) {
    QFile f1(m_cordova->get_app_dir() + "/../qml/facebookconnect.xml");
    f1.open(QIODevice::ReadOnly);

    QDomDocument config;
    config.setContent(f1.readAll(), false);

    QDomNodeList preferences = config.documentElement().elementsByTagName("string");
    for (int i = 0; i < preferences.size(); ++i) {
        QDomNode node = preferences.at(i);
        QDomElement* element = static_cast<QDomElement*>(&node);

        QString name = element->attribute("name"), value = element->text();

        if (name == "fb_app_id")
            _appId = value;
        if (name == "fb_app_name")
            _appName = value;
    }
}

bool Facebookconnect::hasFacebookAccount() {
    Accounts::Manager manager;
    Accounts::Application app = manager.application(appId());

    auto list = manager.accountListEnabled();
    bool enabled = false;

    for (Accounts::AccountId id: list) {
        Accounts::Account *account = Accounts::Account::fromId(&manager, id);
        if (account->providerName() == "facebook")
            enabled = true;
    }

    return enabled;
}

void Facebookconnect::getLoginStatus(int scId, int) {
    if (_token.size())
        cb(scId, "connected");
    else
        cb(scId, "not_authorized");
}

void Facebookconnect::_login(int scId, int ecId, const QList<QString> &permissions) {
    Accounts::Manager manager;
    Accounts::Application app = manager.application(appId());
    auto list = manager.accountListEnabled();
    for (Accounts::AccountId id: list) {
        Accounts::Account *account = Accounts::Account::fromId(&manager, id, this);
        if (account->providerName() != "facebook")
            continue;

        for (Accounts::Service &service: account->services()) {
            if (app.isValid() && app.serviceUsage(service).isEmpty())
                continue;

            Accounts::AccountService *s = new Accounts::AccountService(account, service);
            Accounts::AuthData authData = s->authData();

            SignOn::Identity *identity = SignOn::Identity::existingIdentity(authData.credentialsId(), this);
            QPointer<SignOn::AuthSession> authSession = identity->createSession(authData.method());

            QVariantMap map = authData.parameters();
            map.insert("ClientId", _appId);

            map.insert("WindowId", m_cordova->rootObject()->window()->winId());

            QStringList scopes(permissions);
            scopes.append("publish_actions");
            map.insert("Scope", scopes);

            authSession->connect(authSession.data(), &SignOn::AuthSession::response, [authSession, scId, this] (const SignOn::SessionData &sessionData) {
                _token = sessionData.toMap()["AccessToken"].toString();
                cb(scId, _token);
            });
            authSession->connect(authSession.data(), &SignOn::AuthSession::error, [authSession, ecId, this] (const SignOn::Error &) {
                cb(ecId);
            });
            authSession->process(map, authData.mechanism());
            return;
        }
    }
    cb(ecId, "not_authorized");
}

void Facebookconnect::login(int scId, int ecId, const QList<QString> &permissions) {
    if (!hasFacebookAccount()) {
        OnlineAccountsClient::Setup *setup = new OnlineAccountsClient::Setup(this);

        setup->setProviderId("facebook");
#ifndef Q_PROCESSOR_X86
        setup->setApplicationId(appId());
#endif
        setup->connect(setup, &OnlineAccountsClient::Setup::finished, [=] () {
            _login(scId, ecId, permissions);
        });
        setup->exec();
    } else
        _login(scId, ecId, permissions);
}

void Facebookconnect::getAccessToken(int scId, int ecId) {
    if (_token.size())
        cb(scId, _token);
    else
        cb(ecId, "not_authorized");
}

void Facebookconnect::logout(int, int) {
    _token = "";
}
