sap.ui.define(
  ["sap/m/MessageBox", "sap/m/MessageToast"],
  function (MessageBox, MessageToast) {
    "use strict";

    let _sIdPrefix;
    let _oTable;

    const oController = {
      onInit: function () {
        _sIdPrefix =
          "oup.otc.zotcbomratioupdate::sap.suite.ui.generic.template.ListReport.view.ListReport::ZOTC_C_BOM_CALC_RATIO--";

        // grid table
        _oTable = this.byId(_sIdPrefix + "GridTable");
      },

      onAfterRendering: function () {
        _oTable.attachBusyStateChanged(this._onBusyStateChanged);
      },

      onTestMode: function (_oEvent) {
        this._onUpdate(true /* bTest */);
      },

      onUpdateRatio: function (_oEvent) {
        this._onUpdate(false /* bTest */);
      },

      /* =========================================================== */
      /* internal methods                                            */
      /* =========================================================== */

      _onBusyStateChanged: function (oEvent) {
        const bBusy = oEvent.getParameter("busy");

        if (!bBusy) {
          let oTpc = null;

          // grid table
          if (sap.ui.table.TablePointerExtension) {
            oTpc = new sap.ui.table.TablePointerExtension(_oTable);
          } else {
            oTpc = new sap.ui.table.extensions.Pointer(_oTable);
          }

          // columns
          const aColumns = _oTable.getColumns();
          for (let i = aColumns.length; i >= 0; i--) {
            oTpc.doAutoResizeColumn(i);
          }

          // set column width
          aColumns[0].setWidth("150px");
          aColumns[8].setWidth("150px"); // component
          aColumns[9].setWidth("350px"); // component description
          aColumns[11].setWidth("150px"); // common code
          aColumns[12].setWidth("200px"); // common code description
        }
      },

      _onUpdate: function (bTest) {
        const oView = this.getView();
        const oModel = oView.getModel();
        const oFilterBar = sap.ui
          .getCore()
          .byId(`${_sIdPrefix}listReportFilter`);
        const aControlConfig = oFilterBar.getAggregation(
          "controlConfiguration"
        );
        let urlParameters = {};

        const fnGetValuesFromControl = (oFilterBar, sProperty) => {
          const oControl = oFilterBar.getControlByKey(sProperty);
          const sControlName = oControl.getMetadata().getName();
          let sInput = "";

          if (sControlName === "sap.m.MultiInput") {
            const aTokens = oControl.getTokens();

            for (let i = 0, iLen = aTokens.length; i < iLen; i++) {
              let sKey = aTokens[i].getKey();

              if(!sKey) {
                sKey = aTokens[i].getProperty("text").substr(1);
              }

              sInput += `${sKey}|`;
            }
          } else if (sControlName === "sap.m.Input") {
            sInput = oControl.getValue();
          } else if (
            sControlName === "sap.m.ComboBox" ||
            sControlName === "sap.m.Select"
          ) {
            sInput = oControl.getSelectedKey();
          }

          return sInput;
        };

        for (let i = 0, iLen = aControlConfig.length; i < iLen; i++) {
          const sKey = aControlConfig[i].getKey();
          urlParameters[sKey] = fnGetValuesFromControl(oFilterBar, sKey);
        }

        // test run enable or disable
        urlParameters.test_run = bTest ? "X" : "";

        // start busy indicator
        oView.setBusy(true);

        // size compact
        const bCompact = !!oView.$().closest(".sapUiSizeCompact").length;

        // function import to update
        oModel.callFunction("/BomPriceRatioUpdateFI", {
          method: "POST",
          urlParameters,
          success: function (oData, _oResponse) {
            // stop busy indicator
            oView.setBusy(false);

            let aMessages = oData.message.split("|");
            let sMessage = "";

            if (aMessages.length > 1) {
              for (let i = 0, iLen = aMessages.length; i < iLen; i++) {
                sMessage += `${i + 1}. ${aMessages[i]}\n`;
              }
            } else {
              sMessage = oData.message;
            }

            // information message
            MessageBox.information(sMessage, {
              styleClass: bCompact ? "sapUiSizeCompact" : "",
            });
          },
          error: function (_oError) {
            try {
              // stop busy indicator
              oView.setBusy(false);

              // read error message
              const sResponseText = _oError.responseText;
              const oResponse = JSON.parse(sResponseText);
              const sErrorText = oResponse.error.message.value;

              // error message
              MessageBox.error(sErrorText, {
                styleClass: bCompact ? "sapUiSizeCompact" : "",
              });
            } catch (error) {
              // unable to read error message
            }
          },
        });
      },
    };

    return oController;
  }
);
