/*
 * Sniffer - sniffs web pages to extract information such as JS libraries, CMS, analytics packages, etc.
 * Author: Mark Perkins, mark@allmarkedup.com
 */
 
var Sniffer = (function( win, doc, undefined ){
    
    var sniff       = {},
        detect      = {},
        test_runner = {},
        results     = {},
        scripts     = doc.getElementsByTagName("script"),
        metas       = doc.getElementsByTagName("meta"),
        html        = doc.outerHTML || doc.innerHTML;
    
    // discard meta tags that aren't useful    
    metas = (function(){
        for ( var meta, temp = [], i = -1; meta = metas[++i]; )
        {
            if ( meta.name && meta.content ) temp.push(meta);
        }
        return temp;
    })();
        
    // discard script tags that aren't useful
    scripts = (function(){
        for ( var script, temp = [], i = -1; script = scripts[++i]; )
        {
            if ( script.src ) temp.push(scripts);
        }
        return temp;
    })();
    
    /* test definitions for JS libraries */
    
    detect.js_libs = {
        
        description : 'JavaScript Libraries',
        
        // All individual tests should either return a version number, true or false.
        
        tests : {
            
            'jQuery' : [
                {
                    type : 'custom',
                    test : function(){ return win.jQuery ? win.jQuery.fn.jquery : false; }
                }
            ],
            'jQuery UI' : [
                { 
                    type : 'custom',
                    test : function(){ return win.jQuery && win.jQuery.ui ? win.jQuery.ui.version : false; }
                }
            ],
            'Prototype' : [
                { 
                    type : 'custom',
                    test : function(){ return win.Prototype ? win.Prototype.Version : false; }
                }
            ],
            'Scriptaculous' : [
                { 
                    type : 'custom',
                    test : function(){ return win.Scriptaculous ? win.Scriptaculous.Version : false; }
                }
            ],
            'MooTools' : [
                { 
                    type : 'custom',
                    test : function(){ return win.Prototype ? win.Prototype.Version : false; }
                }
            ],
            'Glow' : [
                { 
                    type : 'custom',
                    test : function(){ return win.glow ? win.glow.VERSION : false; }
                }
            ]
        }
    };
    
    detect.cms = {
        
        description : 'Content Management System',
        
        tests : {
            
            'Wordpress' : [
                {
                    type : 'meta',
                    test : { name : 'generator', match : /WordPress\s?([\w\d\.\-_]*)/i }
                },
                {
                    type : 'text',
                    test : /<link rel=["|']stylesheet["|'] [^>]+wp-content/i
                }
            ]
            
        }
        
    };
    
    detect.analytics = {
        
        description : 'Analytics',
        
        tests : {
            
            'Google Analytics' : [
                { 
                    type : 'custom',
                    test : function(){ return !! win._gat; }
                }
            ],
            'Reinvigorate' : [
                { 
                    type : 'custom',
                    test : function(){ return !! win.reinvigorate; }
                }
            ],
            'Piwik' : [
                { 
                    type : 'custom',
                    test : function(){ return !! win.Piwik; }
                }
            ]
            
        }
        
    };
    
    detect.fonts = {
        
        description : 'Fonts',
        
        tests : {
            
            'Cufon' : [
                { 
                    type : 'custom',
                    test : function(){ return !! win.Cufon }
                }
            ],
            'Typekit' : [
                { 
                    type : 'custom',
                    test : function(){ return !! win.Typekit }
                }
            ],
            'Fontdeck' : [
                { 
                    type : 'text',
                    test : /<link rel=["|']stylesheet["|'] [^>]+f.fontdeck.com/i
                }
            ]
        }
        
    };
        
    /* test runners */
    
    // custom tests just run a function that returns a version number, true or false.
    test_runner.custom = function( test )
    {
        return test();
    }
    
    // check the script src... probably pretty unreliable
    if ( scripts.length )
    {
        test_runner.script = function( test )
        {
            for ( var script, i = -1; script = scripts[++i]; )
            {
                return match( script.src, test );
            }
            return false;
        }        
    }
    else
    {
        // no scripts, tests will always return false.
       test_runner.script = function(){ return false; }
    }
    
    // one off regexp-based tests
    test_runner.text = function( test )
    {
        return match( html, test );
    }
    
    // check the meta elements in the head
    if ( metas.length )
    {    
        test_runner.meta = function( test )
        {
            for ( var meta, i = -1; meta = metas[++i]; )
            {
                if ( meta.name == test.name )
                {
                    var res = match( meta.content, test.match );
                    if ( res ) return res;
                }
            }
            return false;
        }
    }
    else
    {
        // there are no meta elements on the page so this will always return false
        test_runner.meta = function(){ return false; }
    }
    
    // test arg should be a regexp, in which the only *specific* match is the version number
    function match( str, test )
    {
        var match = str.match(test);
        if ( match ) return match[1] && match[1] != '' ? match[1] : true; // return version number if poss or else true.
        return false;
    }
    
    /* main function responsible for running the tests */
    
    var run = function( tests_array )
    {
        for ( var check, i = -1; check = tests_array[++i]; )
        {
            var result = test_runner[check.type]( check.test );
            if ( result !== false ) return result;
        }
        return false;
    }
    
    var empty = function( obj )
    {
        for ( var name in obj ) return false;
        return true;        
    }

    /* publicly available methods */
    
    sniff.run = function()
    {
        if ( ! empty(results) ) return results; // tests have already been run.
        
        for ( group in detect )
        {
            if ( detect.hasOwnProperty(group) )
            {
                for ( test in detect[group].tests )
                {
                    if ( detect[group].tests.hasOwnProperty(test) )
                    {
                        var desc = detect[group].description;
                        results[desc] = results[desc] || {};
                        results[desc][test] = run( detect[group].tests[test] );
                    }
                }
            }
        }
        return results;
    };

    return sniff;
    
})( window, document.documentElement );