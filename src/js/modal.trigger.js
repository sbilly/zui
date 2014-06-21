/* Modal Trigger */
+function ($, window, document, Math)
{
    "use strict";

    if (!$.fn.modal) throw new Error('Modal trigger requires modal.js')
    // if (!String.prototype.format) throw new Error('Modal trigger requires string.js')

    var ModalTrigger = function(element, options)
    {
        this.$         = $(element);
        this.options   = this.getOptions(options);

        this.init();
    };

    ModalTrigger.DEFAULTS =
    {
        type:            'iframe',
        width:           800,
        height:          'auto',
        icon:            '*',
        // title:      '',
        name:            'modalIframe',
        fade:             true,
        // cssClass:   null,
        // headerless: null,
        position:        'fit',
        iframeTeamplate: "<div class='icon-spinner icon-spin loader'></div><div class='modal-dialog modal-iframe' style='width: {width};'><div class='modal-content'><div class='modal-header'><button class='close' data-dismiss='modal'>×</button><h4 class='modal-title'><i class='icon-{icon}'></i> {title}</h4></div><div class='modal-body' style='height:{height}'><iframe id='{name}' name='{name}' src='{url}' frameborder='no' allowtransparency='true' scrolling='auto' hidefocus='' style='width: 100%; height: 100%; left: 0px;'></iframe></div></div></div>"
    };


    ModalTrigger.prototype.getOptions = function (options)
    {
        options = $.extend({title: this.$.text()}, ModalTrigger.DEFAULTS, this.$.data(), options);
        if(options.height && options.height.toString().isNum()) options.height += 'px';
        if(options.width && options.width.toString().isNum()) options.width += 'px';
        if(options.icon == '*')
        {
            var i = this.$.find("[class^='icon-']");
            options.icon = i.length ? i.attr('class').substring(5) : '';
        }
        return options;
    };

    ModalTrigger.prototype.init = function()
    {
        this.initModal();
        this.handleClick();
    };

    ModalTrigger.prototype.handleClick = function()
    {
        var options = this.options;
        var modal   = this.modal;
        this.$.click(function(event)
        {
            var $e   = $(this);
            if($e.attr('disabled') == 'disabled' || $e.hasClass('disabled')) return false;

            var url  = (options ? options.url : false) || $e.attr('href');
            var cssClass = options.cssClass;

            if(options.size == 'fullscreen')
            {
                var $w = $(window);
                options.width = $w.width();
                options.height = $w.height();
                cssClass += ' fullscreen';
            }
            if(options.headerless)
            {
                cssClass += ' hide-header';
            }
            else if(options.size == 'fullscreen')
            {
                options.height -= modal.find('.modal-header').outerHeight();
            }

            modal.addClass('modal-loading').toggleClass('fade', options.fade);;

            if(options.type === 'custom' && options['custom'])
            {
                options['custom']({modal: modal, options: options, element: $e, ready: function()
                {
                    ajustModalPosition(options.position, modal.find('.modal-dialog'));
                    modal.removeClass('modal-loading');
                }});
            }
            else if(options.type === 'ajax')
            {
                modal.load(options.url, function()
                {
                    setTimeout(function()
                    {
                        var modalBody = modal.find('.modal-body'), dialog = modal.find('.modal-dialog');
                        if(options.height != 'auto') modalBody.css('height', options.height);
                        if(options.width) dialog.css('width', options.width);
                        ajustModalPosition(options.position, dialog);
                        modal.removeClass('modal-loading');
                    },200);
                });
            }
            else
            {
                modal.data('first', true);
                modal.html(options.iframeTeamplate.format($.extend({},options,{url: url})));
                var modalBody = modal.find('.modal-body'), dialog = modal.find('.modal-dialog');
                if(cssClass)
                {
                    dialog.addClass(options.cssClass);
                }

                var frame = document.getElementById(options.name);
                frame.onload = frame.onreadystatechange = function()
                {
                    if(!modal.data('first')) modal.addClass('modal-loading');
                    if (this.readyState && this.readyState != 'complete') return;
                    modal.data('first', false);

                    try
                    {
                        var $frame = $(window.frames[options.name].document);

                        if(options.height == 'auto' && options.size != 'fullscreen')
                        {
                            var $framebody = $frame.find('body');
                            setTimeout(function()
                            {
                                modalBody.css('height', $framebody.addClass('body-modal').outerHeight());
                                ajustModalPosition(options.position, dialog);
                                modal.removeClass('modal-loading');
                            }, 100);

                            $framebody.resize(function()
                            {
                                modalBody.css('height', $framebody.outerHeight());
                            });
                        }
                        else
                        {
                            modal.removeClass('modal-loading');
                        }

                        var iframe$ = window.frames[options.name].$;
                        if(iframe$)
                        {
                            iframe$.extend({'closeModal': $.closeModal});
                        }
                    }
                    catch(e){modal.removeClass('modal-loading');}
                }
            }

            modal.modal('show')

            /* Save the href to rel attribute thus we can save it. */
            modal.attr('rel', url);
            return false;
        });
    };

    ModalTrigger.prototype.initModal = function()
    {
        var name = 'triggerModal', setting = this.options;
        var loc  = setting.location;
        if($('#' + name).length)
        {
            /* unbind all events */
            $(name).off('show.bs.modal shown.bs.modal hide.bs.modal hidden.bs.modal');
        }
        else
        {
            /* Addpend modal div. */
            $('<div id="' + name + '" class="modal fade"></div>').appendTo('body');
        }

        var $ajaxModal = $('#' + name);
        this.modal = $ajaxModal.data('options', setting);
        $.extend({'closeModal':function(callback, location)
        {
            location = location || loc;
            $ajaxModal.on('hidden.bs.modal', function()
            {
                if(location)
                {
                    if(location == 'this') window.location.reload();
                    else window.location = location;
                }
                if(callback && $.isFunction(callback)) callback();
            });
            $ajaxModal.modal('hide');
        }});

        /* rebind events */
        if(setting.afterShow && $.isFunction(setting.afterShow)) $ajaxModal.on('show.bs.modal', setting.afterShow);
        if(setting.afterShown && $.isFunction(setting.afterShown)) $ajaxModal.on('shown.bs.modal', setting.afterShown);
        if(setting.afterHide && $.isFunction(setting.afterHide)) $ajaxModal.on('hide.bs.modal', setting.afterHide);
        if(setting.afterHidden && $.isFunction(setting.afterHidden)) $ajaxModal.on('hidden.bs.modal', setting.afterHidden);
    };

    function ajustModalPosition(position, dialog)
    {
        if(position)
        {
           var half = Math.max(0, ($(window).height() - dialog.outerHeight())/2);
           var pos = position == 'fit' ? (half*2/3) : (position == 'center' ? half : position);
           dialog.css('margin-top', pos);
        }
    }

    $.fn.modalTrigger = function(option)
    {
        return this.each(function()
        {
            var $this   = $(this);
            var data    = $this.data('zui.modalTrigger');
            var options = typeof option == 'object' && option;

            if (!data) $this.data('zui.dataTable', (data = new ModalTrigger(this, options)));

            if (typeof option == 'string') data[option]();
        })
    };

    $(function()
    {
        $('[data-toggle="modal"]').each(function(event)
        {
            try
            {
                var $this = $(this);
                if($this.data('type') == 'iframe' || $($this.data('target') + ',' + $this.attr('href')).length < 1)
                {
                    $this.modalTrigger();
                }
            }
            catch(e){}
        });

    });

}(window.jQuery, window, document, Math);
