# Formloader
 
## Description
Use this widget to embed forms in other forms and template grids. 

## Typical usage scenario
- Achieve edit functionality inside template grids 

## Limitations
Mendix 5 does have snippets. Where ever you can; please use the snippets. In some cases where you do need to edit data in a template grid, you can use the formloader.
But before you do; please check if the editable list view is an option too. As a last resort you can fallback on the template grid with this form loader widget.

Close form and other default data view buttons might not work as expected, use them with care.  

Limited performance on large template grids (note that the data view list might be an alternative here).  

## Properties
- Data Source:
    - _Form_ : The data view to be loaded. If empty, and #sharednodeid is not empty, #sharednodeid will be emptied. Note that the context object (if applicable) of the form and the form loader need to match.
    - _Shared node ID_ : If the id of a HTML element is entered here, the formloader will load the form in the designated html elementID with the selected form. Otherwise the form will be loaded inside the widget. This is useful to load a data view inside a predefined element defined by your theme.
    - _Requires context_ : Whether the context of the formloader (if applicable) is passed to the data view being loaded. Note that the type of the context object of the formloader should match type of object required by the data view that is loaded.

- Appearance
    - _Form width_ : The width of the area in which the form is loaded. Use zero for auto.
    - _Fixed height_ : The height of the area in which the form is loaded. Use zero for auto. Using a fixed height might improve the rendering speed and reduce screen flickering.
    - _Max height_ : The height of the area in which the form is loaded. Use zero for auto. Using a fixed height might improve the rendering speed and reduce screen flickering. Not supported in Internet Explorer
    - _Animate_ : Use a fade-in effect when loading the content
   
- Behaviour
    - _Listen target_ : The same (unique) channel as set on the widget it should listen to. So far this is only supported by the Checkbox Set Selector. Please create a Support Ticket if you would like this functionality in a different widget.
    - _Jump to top_ : If this is set, the browser will jump to the top of the page when a new object is loaded.
    - _Cache forms_ : This will improve the performance of reloading the same form multiple times, but might lead to memory issues with large, complex forms.

## Known bugs 
- Close form and other default data view buttons might not work as expected, use them with care.  
- Max height property is not supported in Internet explorer
