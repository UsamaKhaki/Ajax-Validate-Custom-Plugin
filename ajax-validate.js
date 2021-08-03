(function ($) {
    $.fn.ajaxValidate = function (options) {

        let $this = this;

        let defaults = {
            redirectTo: null,
            bootstrap_v: 3,

            // jQuery Confirm Options
            jsConfirm: true,
            jsConfirmIcons: false,

            // jQuery Loading Overlay Options
            loadingOverlay: true,
            loadingOverlaySelector: $this,

            // Ajax Options
            url: function () {
                return $($this).attr('action');
            },
            method: 'POST',
            beforeSend: function () {
                formLoader('show')
            },
            success: function (res) {
                if (res.status === "Validation-Errors") {
                    settings.showValidationErrors(res)
                } else if (res.status === "Success") {
                    settings.onSuccess(res)
                } else {
                    showAlert(res.html)
                }
            },
            onSuccess: function (res){
                if(res){
                    onResponseSuccess(res, settings)
                }
                return 'default';
            },

            // jQuery Validate Options
            selectorVariable: '_validator',
            errorType: "label",
            ignore: '',
            rules: {},
            messages: {},
            showValidationErrors: function (res) {
                let jsonError = [];
                $.each(res.errors, function (ii, ele) {
                    $.each(ele, function (iii, elee) {
                        jsonError[ii] = elee;
                    });
                })
                return selector.showErrors(jsonError);
            }
        };

        let settings = $.extend(defaults, $.fn.ajaxValidate.defaults, options);

        let selector = eval(settings.selectorVariable);

        let formLoader = function (state) {
            if (typeof $.fn.LoadingOverlay === 'function') {
                if (settings.loadingOverlay) {
                    if (state === 'show') {
                        settings.loadingOverlaySelector.LoadingOverlay('show');
                    } else if (state === 'hide') {
                        settings.loadingOverlaySelector.LoadingOverlay('hide');
                    }
                }
            } else {
                if (settings.loadingOverlay) {
                    console.warn('Please include loading overlay plugin to use that.')
                }
            }
        }

        let showAlert = function (content) {
            if (typeof $.confirm === 'function') {
                $.alert(content, 'Error!!');
            } else {
                alert(content);
            }
        }

        let onResponseSuccess = function (res) {
            if (typeof $.confirm === 'function') {
                if (settings.jsConfirm) {
                    $.confirm({
                        icon: settings.jsConfirmIcons ? 'fa fa-check' : false,
                        title: 'Success',
                        content: res.html,
                        buttons: {
                            ok: {
                                text: "OK",
                                btnClass: "btn-green",
                                action: function () {
                                    onOkaySuccessResponse()
                                }
                            },
                        }
                    })
                } else {
                    alert(res.html);
                    onOkaySuccessResponse()
                }
            } else {
                alert(res.html);
            }
        }

        let onOkaySuccessResponse = function () {
            if(settings.redirectTo){
                return window.location.href = settings.redirectTo;
            }else{
                if(settings.modalId){
                    $(typeof settings.modalId === 'boolean' ? '#myModal' : settings.modalId).modal('hide')
                }
                if(settings.tableName){
                    eval(settings.tableName).draw();
                }
            }
        }

        let $validatorOptions = {
            rules: settings.rules,
            messages: settings.messages,
            ignore: settings.ignore,
            submitHandler: function () {
                $.ajax({
                    url: typeof settings.url === 'function' ? settings.url() : settings.url,
                    method: settings.method,
                    data: new FormData($this[0]),
                    processData: false,
                    contentType: false,
                    beforeSend: settings.beforeSend(),
                    success: function (res) {
                        formLoader('hide')
                        settings.success(res, settings)
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        formLoader('hide')
                        showAlert('Error Code: ' + xhr.status + '. ' + thrownError + '. Please contact Admin.');
                    }
                })
            }
        }

        if(![3, 4].includes(settings.bootstrap_v)){
            console.error('Only Bootstrap 3 & 4 supported');
            return false;
        }

        let tooltipMethods = function (state){
            if(state === 'destroy'){
                return settings.bootstrap_v === 3 ? "destroy" : "dispose";
            }else if(state === 'fixTitle'){
                return settings.bootstrap_v === 3 ? "fixTitle" : "_fixTitle";
            }
        }

        if(!settings.redirectTo && !settings.modalId && (settings.onSuccess() === 'default')){
            console.error('RedirectTo undefined, ModalID undefined, onSuccess function undefined')
            return false;
        }

        if(settings.errorType === 'label'){
            $validatorOptions['errorPlacement'] = function (error, element) {
                if (element.parent('.input-group').length) {
                    error.insertAfter(element.parent());
                } else if (element.data('select2')) {
                    if(element.parent('td').length){
                        element.parent('td').append(error);
                    }else if(element.parent().hasClass('form-group')){
                        element.parent('.form-group').append(error);
                    }
                }else{
                    error.insertAfter(element);
                }
            };
        }else if(settings.errorType === 'tooltip'){
            $validatorOptions['showErrors'] = function(errorMap, errorList) {
                $.each(this.successList, function(index, value) {
                    var $this = $(value);
                    var formGroup = $this.closest(".form-group");
                    formGroup.removeClass("has-error").addClass("has-success");
                    if($this.hasClass("select2-hidden-accessible")){
                        $this = formGroup.find(".select2");
                    }
                    if($this.attr('type') == "hidden" || $(value).parent('.file-container').length){
                        $this = formGroup;
                    }
                    formGroup.removeClass('has-success')
                    return $this.tooltip(tooltipMethods('destroy'));
                });
                return $.each(errorList, function(index, value) {
                    var $this = $(value.element);
                    var formGroup = $this.closest(".form-group");

                    if($this.attr('type') == "hidden" || $(value.element).parent('.file-container').length){
                        $this = formGroup;
                    }

                    if($this.hasClass("select2-hidden-accessible")){
                        $this = formGroup.find(".select2");
                    }

                    if(!formGroup.hasClass("has-error")){
                        formGroup.removeClass("has-success").addClass("has-error")
                    }

                    $this.attr("data-toggle","tooltip").attr("title",value.message);
                    return $this.tooltip(tooltipMethods('fixTitle')).tooltip();

                });
            }
        }else{
            consoleError('"label" & "tooltip" are the only values allowed for errorType param');
            return false;
        }

        selector = $this.validate($validatorOptions);

        return this;

    };
}(jQuery));
